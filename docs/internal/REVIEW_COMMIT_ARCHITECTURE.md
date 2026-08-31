# SoundHub: Commit + Pull Request — Архитектурный план

## Контекст

SoundHub — маркетплейс звуковых ассетов для музыкантов. Текущая модель уже включает:
- **Commits** (версии аудио в проекте) — `CommitPage.tsx`, `VersionHistory.tsx`, `DiffPage.tsx`
- **Review Sessions** (аналог Pull Request) — `ReviewSessionPage.tsx`, `ABCompare.tsx`, approval flow, ledger

Цель: добавить 10 недостающих фич, чтобы покрыть полный цикл «загрузка → ревью → approval → merge/delivery».

---

## Gap Analysis: что есть vs что нужно

### ✅ Уже реализовано (бэкенд + фронтенд)
| Компонент | Бэкенд | Фронтенд |
|-----------|--------|----------|
| Version timeline | `ReviewVersion` model | `VersionHistory.tsx` |
| Approve / Request Changes | `ReviewApproval` model | `ApprovalPanel` |
| Text + voice comments | `ReviewComment` (с `time_s`) | `CommentComposer` |
| A/B audio comparison | `VersionComparison` API | `ABCompare.tsx` |
| Ledger (audit trail) | `LedgerEntry` hash chain | `DecisionLog` |
| Release package + delivery | `ReleasePackage` model | `ReleasePackagePanel` |
| Public share link | `share_token` | `PublicReviewPage.tsx` |
| QC Preflight | `preflight` endpoint | inline в `ReleasePackagePanel` |
| Branch protection | `BranchProtection` model | ❌ нет UI |
| Session members | `SessionMember` model | ❌ нет UI для assignment |
| Review rounds | `ReviewRound` model | через ledger |
| Change orders | `ChangeOrder` model | через `ReviewSessionPage` |
| Stems | `StemAsset` model | `StemPanel` |

### ❌ Недостающие фичи (10 штук)

---

## Фича 1: Inline Comments по таймкоду

**Git-аналог:** Comment on specific line in code diff

**Текущее состояние:**
- `ReviewComment.time_s` — поле уже есть в БД ✅
- `CommentComposer` — поддерживает time_s ✅
- Нет: привязки комментария к конкретному месту на waveform

**Что нужно:**
1. **Frontend:** Pin comment markers на waveform (как SoundCloud timestamp comments)
2. **Frontend:** При клике на waveform — создать комментарий с привязкой к time_s
3. **Frontend:** Сортировка комментариев по time_s (timeline view)
4. **Backend:** Уже готово — `time_s` поле есть

**Реализация:**
```
// В WaveformCanvas добавить:
- onClick → setCommentTime(position)
- Маркеры комментариев на waveform (vertpoints)
- Hover tooltip: "comment by @user at 1:23"
```

**Сложность:** Низкая (фронтенд, модель уже есть)

---

## Фича 2: Waveform Diff (визуальный)

**Git-аналог:** Unified diff для кода

**Текущее состояние:**
- `DiffPage.tsx` — только структурный diff DAW-файлов (XML metadata)
- `ABCompare.tsx` — A/B плеер, но не diff view

**Что нужно:**
1. **Frontend:** Новый компонент `WaveformDiff` — два waveform друг над другом
2. **Frontend:** Overlay режим — один waveform поверх другого с прозрачностью
3. **Frontend:** Side-by-side режим — лево/право
4. **Frontend:** LUFS/амплитуда diff — график разницы
5. **Backend:** Endpoint `GET /sessions/{sid}/versions/{vid}/waveform?compare_to={vid2}` — массив amplitude peaks для двух версий

**Реализация:**
```typescript
// WaveformDiff.tsx
interface WaveformDiffProps {
  baseVersionId: number;
  compareVersionId: number;
  sessionId: number;
  mode: 'overlay' | 'side-by-side' | 'difference';
}

// Backend: расширить существующий waveform endpoint
// GET /sessions/{sid}/versions/{vid}/waveform-diff?base={vid1}&compare={vid2}
// Response: { base_peaks: float[], compare_peaks: float[], diff_peaks: float[], 
//             base_lufs: float, compare_lufs: float, diff_db: float }
```

**Сложность:** Средняя (новый компонент + backend endpoint)

---

## Фича 3: Review Checklist (blocking)

**Git-аналог:** CI checks that must pass before merge

**Текущее состояние:**
- `preflight` endpoint — базовые проверки (genre, required_deliverables, blob, watermark)
- Нет: автоматических аудио-проверок, нет blocking перед lock

**Что нужно:**
1. **Backend:** Новая таблица `ReviewCheck` — промежуточные результаты проверок
2. **Backend:** Расширить preflight: LUFS range, clipping detection, silence detection, sample rate compliance
3. **Backend:** Block `lock` если есть failing checks (кроме force)
4. **Frontend:** Checklist панель с чекбоксами статуса (✅/❌/⚠️)
5. **Frontend:** Blocking indicator — «2 checks must pass before lock»

**Модель:**
```python
class ReviewCheck(Base):
    __tablename__ = "review_checks"
    
    id = mapped_column(Integer, primary_key=True)
    session_id = mapped_column(ForeignKey("review_sessions.id"), index=True)
    version_id = mapped_column(ForeignKey("review_versions.id"), nullable=True)
    check_type = mapped_column(String(32))  # lufs_range, clipping, silence, sample_rate, format
    status = mapped_column(String(16))      # pass, fail, warn, skip
    label = mapped_column(String(128))
    detail = mapped_column(Text, default="")
    blocking = mapped_column(Boolean, default=True)
    created_at = mapped_column(DateTime(timezone=True), default=utcnow)
```

**Проверки:**
| Check | Pass | Fail | Blocking |
|-------|------|------|----------|
| LUFS | -14 ± 1 | outside range | yes |
| Clipping | 0 samples at 0dBFS | > 0 | yes |
| Silence | < 500ms intro | > 2s | warn |
| Sample rate | 44.1/48/96 kHz | other | yes |
| Bit depth | 16/24/32 bit | other | warn |
| Duration | > 10s | < 10s | warn |

**Сложность:** Средняя (бэкенд + фронтенд)

---

## Фича 4: Draft Versions

**Git-аналог:** Draft PR (не виден ревьюерам)

**Текущее состояние:**
- `ReviewVersion.status` — поддерживает `in_review`, `approved`
- Нет: состояния `draft`

**Что нужно:**
1. **Backend:** Добавить `draft` в status enum для `ReviewVersion`
2. **Backend:** Доступ к draft-версиям только владельцу (не через public share)
3. **Frontend:** Кнопка «Publish» — draft → in_review
4. **Frontend:** Draft badge в VersionHistory
5. **Frontend:** Фильтр: показывать/скрывать draft версии

**Реализация:**
```python
# schemas.py
class ReviewVersionOut(ORMModel):
    # ... существующие поля
    status: str  # draft | in_review | approved | rejected

# routers/sessions.py
@router.post("/{sid}/versions/{vid}/publish")
async def publish_version(sid, vid, db, user):
    """draft → in_review"""
    v = await get_version_or_404(db, vid)
    assert v.session_id == sid
    assert v.status == "draft"
    v.status = "in_review"
    # ledger event: version.published
```

**Сложность:** Низкая (枚举 + UI badge)

---

## Фича 5: Reviewer Assignment

**Git-аналог:** Requested reviewers на PR

**Текущее состояние:**
- `SessionMember` модель — есть `email`, `role`, `invited_by`
- Нет: UI для назначения ревьюеров, нет уведомлений

**Что нужно:**
1. **Backend:** Эндпоинт `POST /sessions/{sid}/members` — пригласить ревьюера
2. **Backend:** Эндпоинт `DELETE /sessions/{sid}/members/{email}` — удалить
3. **Backend:** Эндпоинт `GET /sessions/{sid}/members` — список
4. **Frontend:** Панель «Reviewers» с аватарами + статусами (pending/reviewed/approved)
5. **Frontend:** Invite form (email + role select)
6. **Frontend:** Badge «requested reviewer» в version timeline

**Реализация:**
```python
# schemas.py
class SessionMemberCreate(BaseModel):
    email: EmailStr
    role: str = "reviewer"  # reviewer | commenter | viewer

class SessionMemberOut(ORMModel):
    email: str
    role: str
    invited_by: str
    status: str  # pending | reviewed | approved
    created_at: datetime

# routers/sessions.py
@router.post("/{sid}/members")
async def invite_member(sid, payload: SessionMemberCreate, db, user):
    member = SessionMember(session_id=sid, email=payload.email, 
                           role=payload.role, invited_by=user.username)
    db.add(member)
    # ledger event: team.member_invited
    # TODO: send email notification

@router.get("/{sid}/members")
async def list_members(sid, db):
    return db.execute(select(SessionMember).where(...)).scalars().all()
```

**Сложность:** Низкая (модель уже есть, нужен UI)

---

## Фича 6: Merge Queue

**Git-аналог:** Merge button + branch protection

**Текущее состояние:**
- `ReleasePackage` — уже есть lock + delivery
- `BranchProtection` модель — есть `require_pull_request`, `required_reviewers`
- Нет: UI для merge queue, нет branch protection rules

**Что нужно:**
1. **Backend:** Эндпоинт `POST /sessions/{sid}/merge` — «зарелизить» approved версию
2. **Backend:** Merge queue: очередь approved, но не замерженных
3. **Backend:** Branch protection rules: required reviewers, status checks
4. **Frontend:** Merge queue view — список approved versions等待 merge
5. **Frontend:** Merge button с confirmation
6. **Frontend:** Branch protection settings page

**Реализация:**
```python
# Новая модель
class MergeQueue(Base):
    __tablename__ = "merge_queue"
    
    id = mapped_column(Integer, primary_key=True)
    session_id = mapped_column(ForeignKey("review_sessions.id"), index=True)
    version_id = mapped_column(ForeignKey("review_versions.id"), index=True)
    status = mapped_column(String(16))  # queued | merging | merged | failed
    created_at = mapped_column(DateTime(timezone=True), default=utcnow)
    merged_at = mapped_column(DateTime(timezone=True), nullable=True)

# Endpoints
POST /sessions/{sid}/merge-queue     → добавить approved версию в очередь
POST /sessions/{sid}/merge-queue/{qid}/merge → выполнить merge
GET  /sessions/{sid}/merge-queue     → список очереди
```

**Сложность:** Средняя-высокая (новая модель + UI + логика)

---

## Фича 7: Version Tags

**Git-аналог:** git tag (v1.0, beta, release)

**Текущее состояние:**
- Нет: модели tags, нет UI

**Что нужно:**
1. **Backend:** Новая таблица `VersionTag`
2. **Backend:** CRUD endpoints для tags
3. **Frontend:** Tag badges в VersionHistory
4. **Frontend:** Tag picker при создании/редактировании версии

**Модель:**
```python
class VersionTag(Base):
    __tablename__ = "version_tags"
    
    id = mapped_column(Integer, primary_key=True)
    version_id = mapped_column(ForeignKey("review_versions.id"), index=True)
    name = mapped_column(String(64))  # v1.0, beta, release-candidate, final
    color = mapped_column(String(7), default="#888888")
    created_by = mapped_column(ForeignKey("users.id"))
    created_at = mapped_column(DateTime(timezone=True), default=utcnow)
    
    __table_args__ = (UniqueConstraint("version_id", "name"),)
```

**Типы тегов (predefined):**
- `release-candidate` (🟡)
- `final` (🟢)
- `beta` (🔵)
- `archived` (⚪)

**Сложность:** Низкая (простая модель + badges)

---

## Фича 8: Conflict Resolution

**Git-аналог:** Merge conflicts

**Текущее состояние:**
- Нет: два инженера не могут одновременно загружать версии

**Что нужно:**
1. **Backend:** Optimistic locking на `ReviewVersion` — `version_number` auto-increment
2. **Backend:** Если两个人 загрузили version с одинаковым `round_number` → conflict
3. **Backend:** Эндпоинт `POST /sessions/{sid}/versions/{vid}/resolve` — разрешить конфликт
4. **Frontend:** Conflict resolution UI — показать обе версии, выбрать победителя

**Реализация:**
```python
# При загрузке версии:
# 1. Начать транзакцию
# 2. SELECT MAX(number) FROM review_versions WHERE session_id = sid
# 3. INSERT с number = max + 1
# 4. Если conflict (unique constraint) → вернуть conflict error

@router.post("/{sid}/versions")
async def upload_version(sid, db, user, audio: UploadFile):
    # Optimistic lock
    max_num = db.execute(
        select(func.max(ReviewVersion.number)).where(ReviewVersion.session_id == sid)
    ).scalar() or 0
    
    # Если round_number конфликтует
    existing = db.execute(
        select(ReviewVersion).where(
            ReviewVersion.session_id == sid,
            ReviewVersion.round_number == current_round
        )
    ).scalar_one_or_none()
    
    if existing and existing.author_id != user.id:
        raise HTTPException(409, detail={
            "error": "conflict",
            "existing_version_id": existing.id,
            "existing_author": existing.author.username,
            "message": f"Version already uploaded by {existing.author.username}"
        })
```

**Сложность:** Средняя (backend locking + UI)

---

## Фича 9: Review Summary (auto-generated)

**Git-аналог:** PR description auto-generated (what changed)

**Текущее состояние:**
- DiffPage — показывает diff, но без summary
- Нет: автоматического summary

**Что нужно:**
1. **Backend:** Endpoint `GET /sessions/{sid}/versions/{vid}/summary` — auto-generated diff summary
2. **Backend:** Сравнение: LUFS, tempo, key, sample rate, plugins, duration
3. **Frontend:** Summary card в CommitPage — «Changed: LUFS -14.2 → -13.8, added 2 stems»
4. **Frontend:** Summary в review email/notification

**Реализация:**
```python
@router.get("/{sid}/versions/{vid}/summary")
async def version_summary(sid, vid, db, user):
    version = await get_version_or_404(db, vid)
    prev = db.execute(
        select(ReviewVersion).where(
            ReviewVersion.session_id == sid,
            ReviewVersion.number < version.number
        ).order_by(ReviewVersion.number.desc()).limit(1)
    ).scalar_one_or_none()
    
    changes = []
    if prev:
        # Compare audio metadata
        if version.duration_s != prev.duration_s:
            changes.append({"field": "duration", "old": prev.duration_s, "new": version.duration_s})
        if version.size != prev.size:
            changes.append({"field": "size", "old": prev.size, "new": version.size})
        # Compare LUFS if available
        # Compare waveform peaks
    
    return {
        "version_id": vid,
        "previous_version_id": prev.id if prev else None,
        "changes": changes,
        "summary": generate_text_summary(changes),
    }
```

**Сложность:** Средняя (backend analysis + frontend card)

---

## Фича 10: Required Reviews

**Git-аналог:** Branch protection — required reviewers

**Текущее состояние:**
- `BranchProtection` модель — есть `required_reviewers` (int)
- Нет: UI, нет enforcement

**Что нужно:**
1. **Backend:** Branch protection rules CRUD
2. **Backend:** Enforcement: `lock` blocked если required reviewers не approval
3. **Frontend:** Settings page для branch protection rules
4. **Frontend:** Badge «N of M reviewers approved» в ReviewSessionPage

**Реализация:**
```python
# routers/branches.py
@router.post("/{pid}/branch-protection")
async def set_branch_protection(pid, payload: BranchProtectionCreate, db, user):
    bp = BranchProtection(
        project_id=pid,
        branch_name=payload.branch_name,
        require_pull_request=payload.require_pull_request,
        required_reviewers=payload.required_reviewers,
        require_status_checks=payload.require_status_checks,
    )
    db.add(bp)
    return bp

# При lock release package:
@router.post("/release-packages/{pid}/lock")
async def lock_package(pid, ...):
    # Проверить branch protection
    bp = db.execute(
        select(BranchProtection).where(
            BranchProtection.project_id == session.project_id,
            BranchProtection.branch_name == "main"
        )
    ).scalar_one_or_none()
    
    if bp and bp.required_reviewers > 0:
        approved_count = db.execute(
            select(func.count(ReviewApproval.id)).where(
                ReviewApproval.session_id == session.id,
                ReviewApproval.approved == True
            )
        ).scalar()
        
        if approved_count < bp.required_reviewers:
            raise HTTPException(403, detail=f"Need {bp.required_reviewers} approvals, got {approved_count}")
```

**Сложность:** Средняя (модель есть, нужен enforcement + UI)

---

## Порядок реализации (приоритет)

| Приоритет | Фича | Сложность | Зависимости |
|-----------|------|-----------|-------------|
| **P0** | 1. Inline comments | Низкая | — |
| **P0** | 4. Draft versions | Низкая | — |
| **P0** | 7. Version tags | Низкая | — |
| **P1** | 5. Reviewer assignment | Низкая | — |
| **P1** | 9. Review summary | Средняя | — |
| **P1** | 2. Waveform diff | Средняя | — |
| **P2** | 3. Review checklist | Средняя | — |
| **P2** | 10. Required reviews | Средняя | #5 |
| **P3** | 6. Merge queue | Средняя-высокая | #3, #5, #10 |
| **P3** | 8. Conflict resolution | Средняя | #4 |

---

## API Endpoints (сводная таблица)

### Новые endpoints

| Метод | Путь | Фича | Описание |
|-------|------|------|----------|
| `POST` | `/sessions/{sid}/versions/{vid}/publish` | #4 | draft → in_review |
| `POST` | `/sessions/{sid}/versions/{vid}/tags` | #7 | Добавить тег |
| `DELETE` | `/sessions/{sid}/versions/{vid}/tags/{tag_id}` | #7 | Удалить тег |
| `GET` | `/sessions/{sid}/versions/{vid}/tags` | #7 | Список тегов |
| `GET` | `/sessions/{sid}/versions/{vid}/summary` | #9 | Auto-generated diff summary |
| `GET` | `/sessions/{sid}/versions/{vid}/waveform-diff` | #2 | Waveform peaks для A/B |
| `POST` | `/sessions/{sid}/members` | #5 | Пригласить ревьюера |
| `DELETE` | `/sessions/{sid}/members/{email}` | #5 | Удалить ревьюера |
| `GET` | `/sessions/{sid}/members` | #5 | Список ревьюеров |
| `POST` | `/sessions/{sid}/merge-queue` | #6 | Добавить в merge queue |
| `POST` | `/sessions/{sid}/merge-queue/{qid}/merge` | #6 | Выполнить merge |
| `GET` | `/sessions/{sid}/merge-queue` | #6 | Список очереди |
| `POST` | `/projects/{pid}/branch-protection` | #10 | Set branch protection |
| `GET` | `/projects/{pid}/branch-protection` | #10 | Get branch protection |
| `POST` | `/sessions/{sid}/checks/run` | #3 | Запустить preflight checks |
| `GET` | `/sessions/{sid}/checks` | #3 | Результаты checks |

### Существующие endpoints (расширение)

| Метод | Путь | Изменение |
|-------|------|-----------|
| `POST` | `/sessions/{sid}/versions` | Добавить `draft` параметр |
| `GET` | `/sessions/{sid}/versions` | Фильтр по status (draft/in_review/approved) |
| `POST` | `/release-packages/{pid}/lock` | Enforcement: branch protection + required reviewers |

---

## Database Changes (миграции)

### Новые таблицы

```sql
-- Version Tags
CREATE TABLE version_tags (
    id SERIAL PRIMARY KEY,
    version_id INTEGER REFERENCES review_versions(id),
    name VARCHAR(64) NOT NULL,
    color VARCHAR(7) DEFAULT '#888888',
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(version_id, name)
);

-- Review Checks
CREATE TABLE review_checks (
    id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES review_sessions(id),
    version_id INTEGER REFERENCES review_versions(id),
    check_type VARCHAR(32) NOT NULL,
    status VARCHAR(16) NOT NULL,
    label VARCHAR(128) NOT NULL,
    detail TEXT DEFAULT '',
    blocking BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Merge Queue
CREATE TABLE merge_queue (
    id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES review_sessions(id),
    version_id INTEGER REFERENCES review_versions(id),
    status VARCHAR(16) DEFAULT 'queued',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    merged_at TIMESTAMPTZ
);
```

### Существующие таблицы (изменения)

```sql
-- ReviewVersion: добавить draft status
-- Уже поддерживается через status enum, миграция не нужна

-- BranchProtection: уже существует
-- Добавить UI endpoints
```

---

## Frontend Components (новые)

| Компонент | Фича | Описание |
|-----------|------|----------|
| `WaveformDiff.tsx` | #2 | Визуальный diff двух waveform |
| `ReviewChecklist.tsx` | #3 | QC checks panel с blocking indicator |
| `VersionTagBadge.tsx` | #7 | Badge для тегов версий |
| `TagPicker.tsx` | #7 | Выбор/создание тегов |
| `ReviewerPanel.tsx` | #5 | Список ревьюеров + invite |
| `MergeQueueView.tsx` | #6 | Merge queue с approve/merge |
| `BranchProtectionSettings.tsx` | #10 | Настройки branch protection |
| `VersionSummary.tsx` | #9 | Auto-generated diff summary |
| `ConflictResolver.tsx` | #8 | UI для разрешения конфликтов |
| `InlineCommentMarkers.tsx` | #1 | Маркеры комментариев на waveform |

---

## Оценка трудозатрат

| Фича | Backend | Frontend | Всего |
|------|---------|----------|-------|
| 1. Inline comments | 0.5д | 2д | 2.5д |
| 2. Waveform diff | 2д | 3д | 5д |
| 3. Review checklist | 2д | 2д | 4д |
| 4. Draft versions | 0.5д | 1д | 1.5д |
| 5. Reviewer assignment | 1д | 2д | 3д |
| 6. Merge queue | 3д | 3д | 6д |
| 7. Version tags | 0.5д | 1д | 1.5д |
| 8. Conflict resolution | 2д | 2д | 4д |
| 9. Review summary | 1.5д | 1.5д | 3д |
| 10. Required reviews | 1д | 1.5д | 2.5д |
| **Итого** | **14д** | **19д** | **33д** |

---

## Рекомендуемый порядок

**Спринт 1 (быстрые победы):** #1, #4, #7 — 5.5 дней
**Спринт 2 (core review):** #5, #9, #2 — 11 дней
**Спринт 3 (automation):** #3, #10 — 6.5 дней
**Спринт 4 (advanced):** #6, #8 — 10 дней
