"""Storage lifecycle policy definitions and utilities."""

from enum import IntEnum
from typing import Optional


class StorageTier(IntEnum):
    """Storage tiers from fastest/most expensive to slowest/least expensive."""
    HOT = 0      # Immediate access, highest performance
    WARM = 1     # Slower access, lower cost
    COLD = 2     # Slowest access, lowest cost (archive)


# Default storage policy values (in days)
DEFAULT_HOT_DAYS = 30   # Keep in hot storage for 30 days
DEFAULT_WARM_DAYS = 90  # Keep in warm storage for 90 days (after hot period)
DEFAULT_COLD_DAYS = 365 # Keep in cold storage for 365 days (after warm period)
# After cold period, objects could be deleted or kept indefinitely based on policy


def calculate_touchstone_date(
    created_timestamp: float,
    hot_days: int,
    warm_days: int,
    cold_days: int
) -> tuple[float, float, float]:
    """
    Calculate the timestamps when an object should transition between storage tiers.

    Args:
        created_timestamp: Unix timestamp when the object was created
        hot_days: Days to keep in hot storage
        warm_days: Days to keep in warm storage
        cold_days: Days to keep in cold storage

    Returns:
        Tuple of (hot_to_warm_timestamp, warm_to_cold_timestamp, cold_to_delete_timestamp)
    """
    hot_to_warm = created_timestamp + (hot_days * 24 * 60 * 60)
    warm_to_cold = hot_to_warm + (warm_days * 24 * 60 * 60)
    cold_to_delete = warm_to_cold + (cold_days * 24 * 60 * 60)

    return hot_to_warm, warm_to_cold, cold_to_delete


def determine_storage_tier(
    created_timestamp: float,
    current_timestamp: float,
    hot_days: int,
    warm_days: int,
    cold_days: int,
    enabled: bool = True
) -> StorageTier:
    """
    Determine which storage tier an object should be in based on its age and the policy.

    Args:
        created_timestamp: Unix timestamp when the object was created
        current_timestamp: Current Unix timestamp
        hot_days: Days to keep in hot storage
        warm_days: Days to keep in warm storage
        cold_days: Days to keep in cold storage
        enabled: Whether the storage lifecycle policy is enabled

    Returns:
        The appropriate StorageTier for the object
    """
    if not enabled:
        # If policy is disabled, keep everything in hot storage
        return StorageTier.HOT

    hot_to_warm, warm_to_cold, cold_to_delete = calculate_touchstone_date(
        created_timestamp, hot_days, warm_days, cold_days
    )

    if current_timestamp < hot_to_warm:
        return StorageTier.HOT
    elif current_timestamp < warm_to_cold:
        return StorageTier.WARM
    elif current_timestamp < cold_to_delete:
        return StorageTier.COLD
    else:
        # Object has exceeded cold storage period
        # In a full implementation, we might delete it or keep it in cold indefinitely
        # For now, we'll keep it in cold storage
        return StorageTier.COLD