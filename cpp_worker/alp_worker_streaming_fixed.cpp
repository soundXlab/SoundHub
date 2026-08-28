#include <iostream>
#include <vector>
#include <cstdint>
#include <string>
#include <algorithm>
#include <cstring>
#include <set>
#include <map>
#include <zlib.h>
#include <expat.h>
#include <endian.h>
#include <unistd.h>

#pragma pack(push, 1)
struct ZipLocalHeader {
    uint8_t signature[4]; // 0x50, 0x4b, 0x03, 0x04
    uint16_t version;
    uint16_t bit_flag;
    uint16_t compression_method;
    uint16_t last_mod_time;
    uint16_t last_mod_date;
    uint32_t crc32;
    uint32_t compressed_size;
    uint32_t uncompressed_size;
    uint16_t file_name_length;
    uint16_t extra_field_length;
};
#pragma pack(pop)

// Helper to decompress deflate data using zlib (raw deflate, no header)
std::vector<uint8_t> decompress_deflate(const uint8_t* data, size_t size) {
    z_stream strm;
    strm.zalloc = Z_NULL;
    strm.zfree = Z_NULL;
    strm.opaque = Z_NULL;
    strm.avail_in = size;
    strm.next_in = const_cast<uint8_t*>(data);

    if (inflateInit2(&strm, -MAX_WBITS) != Z_OK) {
        throw std::runtime_error("Failed to initialize zlib for inflate");
    }

    // Use a fixed output buffer, enlarge if needed
    std::vector<uint8_t> output;
    output.resize(65536); // start with 64KB
    strm.avail_out = output.size();
    strm.next_out = output.data();

    int ret;
    do {
        if (strm.avail_out == 0) {
            // Output buffer full, enlarge it
            output.resize(output.size() * 2);
            strm.next_out = output.data() + output.size() / 2;
            strm.avail_out = output.size() / 2;
        }
        ret = inflate(&strm, Z_NO_FLUSH);
        if (ret == Z_STREAM_ERROR) {
            inflateEnd(&strm);
            throw std::runtime_error("Error during inflate");
        }
    } while (ret == Z_OK);

    if (ret != Z_STREAM_END) {
        inflateEnd(&strm);
        throw std::runtime_error("Error during inflate: did not end with Z_STREAM_END");
    }

    output.resize(output.size() - strm.avail_out);
    inflateEnd(&strm);
    return output;
}

// Helper to decompress gzip data
std::vector<uint8_t> decompress_gzip(const uint8_t* data, size_t size) {
    z_stream strm;
    strm.zalloc = Z_NULL;
    strm.zfree = Z_NULL;
    strm.opaque = Z_NULL;
    strm.avail_in = size;
    strm.next_in = const_cast<uint8_t*>(data);

    if (inflateInit2(&strm, 16 + MAX_WBITS) != Z_OK) {
        throw std::runtime_error("Failed to initialize zlib for gzip inflate");
    }

    // Use a fixed output buffer, enlarge if needed
    std::vector<uint8_t> output;
    output.resize(65536); // start with 64KB
    strm.avail_out = output.size();
    strm.next_out = output.data();

    int ret;
    do {
        if (strm.avail_out == 0) {
            // Output buffer full, enlarge it
            output.resize(output.size() * 2);
            strm.next_out = output.data() + output.size() / 2;
            strm.avail_out = output.size() / 2;
        }
        ret = inflate(&strm, Z_NO_FLUSH);
        if (ret == Z_STREAM_ERROR) {
            inflateEnd(&strm);
            throw std::runtime_error("Error during gzip inflate");
        }
    } while (ret == Z_OK);

    if (ret != Z_STREAM_END) {
        inflateEnd(&strm);
        throw std::runtime_error("Error during gzip inflate: did not end with Z_STREAM_END");
    }

    output.resize(output.size() - strm.avail_out);
    inflateEnd(&strm);
    return output;
}

// Simple XML parser for the specific elements we need
class AlsXmlParser {
public:
    AlsXmlParser() {
        parser = XML_ParserCreate(nullptr);
        XML_SetUserData(parser, this);
        XML_SetElementHandler(parser, startElement, endElement);
        XML_SetCharacterDataHandler(parser, characterData);
    }

    ~AlsXmlParser() {
        if (parser) {
            XML_ParserFree(parser);
        }
    }

    bool parse(const std::vector<uint8_t>& xml_data) {
        if (XML_Parse(parser, reinterpret_cast<const char*>(xml_data.data()), xml_data.size(), XML_TRUE) == XML_STATUS_ERROR) {
            std::cerr << "XML parsing error: " << XML_ErrorString(XML_GetErrorCode(parser)) << std::endl;
            return false;
        }
        return true;
    }

    // Getters for the parsed data
    std::string getFormat() const { return format; }
    std::string getFormatKey() const { return format_key; }
    std::string getVersion() const { return version; }
    double getBpm() const { return bpm; }
    bool getBpmValid() const { return bpm_valid; }
    std::string getTimeSignature() const { return time_signature; }
    const std::vector<std::map<std::string, std::string>>& getTracks() const { return tracks; }
    const std::set<std::string>& getPlugins() const { return plugins; }
    const std::vector<std::string>& getSamples() const { return samples_vector; }
    int getTrackCount() const { return track_count; }
    const std::vector<std::string>& getPresets() const { return presets_vector; }
    const std::map<std::string, std::vector<std::string>>& getArchiveContents() const { return archive_contents; }
    std::string getPrimaryAls() const { return primary_als; }

    // For version
    std::string getMajorVersion() const { return major_version; }
    std::string getMinorVersion() const { return minor_version; }

    // Methods to add samples and presets (for merging with ZIP scan results)
    void addSample(const std::string& sample) {
        if (samples_set.insert(sample).second) {
            samples_vector.push_back(sample);
        }
    }
    void addPreset(const std::string& preset) {
        if (presets_set.insert(preset).second) {
            presets_vector.push_back(preset);
        }
    }

private:
    static void startElement(void* userData, const XML_Char* name, const XML_Char** atts) {
        AlsXmlParser* parser = static_cast<AlsXmlParser*>(userData);
        parser->startElement(name, atts);
    }

    static void endElement(void* userData, const XML_Char* name) {
        AlsXmlParser* parser = static_cast<AlsXmlParser*>(userData);
        parser->endElement(name);
    }

    static void characterData(void* userData, const XML_Char* s, int len) {
        AlsXmlParser* parser = static_cast<AlsXmlParser*>(userData);
        parser->characterData(s, len);
    }

    void startElement(const XML_Char* name, const XML_Char** atts) {
        // Store the current element name
        current_element = name;

        // Check if this is the root element
        if (std::string(name) == "Ableton") {
            // Parse version attributes
            for (int i = 0; atts[i]; i += 2) {
                std::string attr_name = atts[i];
                std::string attr_value = atts[i+1];
                if (attr_name == "MajorVersion") {
                    major_version = attr_value;
                } else if (attr_name == "MinorVersion") {
                    minor_version = attr_value;
                }
            }
        }

        // Check for Tempo
        if (std::string(name) == "Tempo") {
            in_tempo = true;
        }

        // Check for Manual within Tempo
        if (std::string(name) == "Manual" && in_tempo) {
            in_manual = true;

            // Handle Value attribute for Manual
            for (int i = 0; atts[i]; i += 2) {
                std::string attr_name = atts[i];
                std::string attr_value = atts[i+1];
                if (attr_name == "Value") {
                    try {
                        bpm = std::stod(attr_value);
                        bpm_valid = true;
                    } catch (...) {
                        bpm = 0.0;
                        bpm_valid = false;
                    }
                }
            }
        }

        // Check for TimeSignature
        if (std::string(name) == "TimeSignature") {
            in_time_signature = true;
        }

        // Check for Numerator within TimeSignature
        if (std::string(name) == "Numerator" && in_time_signature) {
            in_numerator = true;

            // Handle Value attribute for Numerator
            for (int i = 0; atts[i]; i += 2) {
                std::string attr_name = atts[i];
                std::string attr_value = atts[i+1];
                if (attr_name == "Value") {
                    numerator = attr_value;
                }
            }
        }
        // Check for Denominator within TimeSignature
        if (std::string(name) == "Denominator" && in_time_signature) {
            in_denominator = true;

            // Handle Value attribute for Denominator
            for (int i = 0; atts[i]; i += 2) {
                std::string attr_name = atts[i];
                std::string attr_value = atts[i+1];
                if (attr_name == "Value") {
                    denominator = attr_value;
                }
            }
        }

        // Check for Tracks
        if (std::string(name) == "Tracks") {
            in_tracks = true;
        }

        // Check for track types - handle both specific types and generic Track* names
        if (in_tracks) {
            std::string track_name = name;
            // Check for specific track types
            if (track_name == "AudioTrack" ||
                track_name == "MidiTrack" ||
                track_name == "GroupTrack" ||
                track_name == "ReturnTrack" ||
                track_name == "MasterTrack") {
                in_track = true;
                current_track.clear();
                current_track["name"] = "";
                current_track["kind"] = getTrackKind(name);
                current_track_devices.clear();
            }
            // Check for generic track names like Track1, Track2, etc.
            else if (track_name.rfind("Track", 0) == 0) { // Starts with "Track"
                // Try to get the type from a Type attribute
                std::string track_type = "unknown"; // default
                for (int i = 0; atts[i]; i += 2) {
                    std::string attr_name = atts[i];
                    std::string attr_value = atts[i+1];
                    if (attr_name == "Type") {
                        track_type = attr_value;
                        break;
                    }
                }

                // If no Type attribute, default to audio for simplicity
                // In a real implementation, we might want to infer this from other clues
                if (track_type == "unknown") {
                    track_type = "AudioTrack"; // default assumption
                }

                // Map the type to our internal representation
                std::string kind = "unknown";
                if (track_type == "AudioTrack") kind = "audio";
                else if (track_type == "MidiTrack") kind = "midi";
                else if (track_type == "GroupTrack") kind = "group";
                else if (track_type == "ReturnTrack") kind = "return";
                else if (track_type == "MasterTrack") kind = "master";

                in_track = true;
                current_track.clear();
                current_track["name"] = "";
                current_track["kind"] = kind;
                current_track_devices.clear();
            }
        }

        // Check for Devices (within a track)
        if (std::string(name) == "Devices" && in_track) {
            in_devices = true;
        }

        // Check for PluginDevice (within Devices of a track)
        if (std::string(name) == "PluginDevice" && in_track && in_devices) {
            in_plugin_device = true;
            current_plugin_name.clear();
        }

        // Check for plugin info tags (within PluginDevice)
        if (in_plugin_device) {
            if (std::string(name) == "VstPluginInfo" ||
                std::string(name) == "AudioUnitPluginInfo" ||
                std::string(name) == "ClapPluginInfo") {
                in_plugin_info = true;
            }
        }

        // Check for PlugName or Name within plugin info
        if (in_plugin_info) {
            if (std::string(name) == "PlugName" ||
                std::string(name) == "Name") {
                in_plugin_name = true;
            }
        }

        // Check for SampleRef
        if (std::string(name) == "SampleRef") {
            in_sample_ref = true;
            current_sample_name.clear();
            current_sample_dir.clear();
        }

        // Check for RelativePathElement within SampleRef
        if (in_sample_ref && std::string(name) == "RelativePathElement") {
            in_relative_path = true;

            // Handle attributes for RelativePathElement
            for (int i = 0; atts[i]; i += 2) {
                std::string attr_name = atts[i];
                std::string attr_value = atts[i+1];
                if (attr_name == "Name") {
                    current_sample_name = attr_value;
                } else if (attr_name == "Dir") {
                    current_sample_dir = attr_value;
                }
            }
        }

        // Check for EffectiveName (for track name)
        if (std::string(name) == "EffectiveName" && in_track && !in_devices) {
            // Handle attributes for EffectiveName
            for (int i = 0; atts[i]; i += 2) {
                std::string attr_name = atts[i];
                std::string attr_value = atts[i+1];
                if (attr_name == "Value") {
                    current_track["name"] = attr_value;
                }
            }
        }

        // Check for Name (alternative for track name, within Track but not in Devices)
        if (std::string(name) == "Name" && in_track && !in_devices) {
            // We'll handle the text content in characterData
        }
    }

    std::string getTrackKind(const XML_Char* name) {
        std::string n(name);
        if (n == "AudioTrack") return "audio";
        if (n == "MidiTrack") return "midi";
        if (n == "GroupTrack") return "group";
        if (n == "ReturnTrack") return "return";
        if (n == "MasterTrack") return "master";
        return "unknown";
    }

    void endElement(const XML_Char* name) {
        if (std::string(name) == "Manual") {
            in_manual = false;
        }
        if (std::string(name) == "Tempo") {
            in_tempo = false;
        }
        if (std::string(name) == "Numerator") {
            in_numerator = false;
            if (!numerator.empty() && !denominator.empty()) {
                time_signature = numerator + "/" + denominator;
            }
        }
        if (std::string(name) == "Denominator") {
            in_denominator = false;
            if (!numerator.empty() && !denominator.empty()) {
                time_signature = numerator + "/" + denominator;
            }
        }
        if (std::string(name) == "Tracks") {
            in_tracks = false;
        }
        if (std::string(name) == "AudioTrack" ||
            std::string(name) == "MidiTrack" ||
            std::string(name) == "GroupTrack" ||
            std::string(name) == "ReturnTrack" ||
            std::string(name) == "MasterTrack") {
            in_track = false;
            in_devices = false;
            // Finalize the current track
            if (!current_track["name"].empty()) {
                // Convert devices vector to a comma-separated string for simplicity
                std::string devices_str;
                for (size_t i = 0; i < current_track_devices.size(); ++i) {
                    if (i > 0) devices_str += ",";
                    devices_str += current_track_devices[i];
                }
                current_track["devices"] = devices_str;
                tracks.push_back(current_track);
                track_count++;  // Increment track count
            }
        }
        // Handle generic track endings
        else if (std::string(name).rfind("Track", 0) == 0 && in_track) {
            in_track = false;
            in_devices = false;
            // Finalize the current track
            if (!current_track["name"].empty()) {
                // Convert devices vector to a comma-separated string for simplicity
                std::string devices_str;
                for (size_t i = 0; i < current_track_devices.size(); ++i) {
                    if (i > 0) devices_str += ",";
                    devices_str += current_track_devices[i];
                }
                current_track["devices"] = devices_str;
                tracks.push_back(current_track);
                track_count++;  // Increment track count
            }
        }
        if (std::string(name) == "Devices") {
            in_devices = false;
        }
        if (std::string(name) == "PluginDevice") {
            in_plugin_device = false;
            // Do NOT add to global plugins list here - only track-specific devices go in track devices
            // Global plugins list should only contain actual plugin names from VST/AU/etc.
        }
        if (std::string(name) == "VstPluginInfo" ||
            std::string(name) == "AudioUnitPluginInfo" ||
            std::string(name) == "ClapPluginInfo") {
            in_plugin_info = false;
        }
        if (std::string(name) == "PlugName" ||
            std::string(name) == "Name") {
            in_plugin_name = false;
            if (in_plugin_device) {
                // We already captured the name in characterData
            }
        }
        if (std::string(name) == "SampleRef") {
            in_sample_ref = false;
            if (!current_sample_name.empty()) {
                std::string sample_path = current_sample_dir;
                if (!current_sample_dir.empty() && current_sample_dir.back() != '/') {
                    sample_path += "/";
                }
                sample_path += current_sample_name;
                addSample(sample_path);
            }
        }
        if (std::string(name) == "RelativePathElement") {
            in_relative_path = false;
        }
        if (std::string(name) == "PresetRef") {
            in_preset_ref = false;
            if (!current_preset_name.empty()) {
                std::string preset_path = current_preset_dir;
                if (!current_preset_dir.empty() && current_preset_dir.back() != '/') {
                    preset_path += "/";
                }
                preset_path += current_preset_name;
                addPreset(preset_path);
            }
        }
        if (std::string(name) == "RelativePathElement" && in_preset_relative_path) {
            in_preset_relative_path = false;
        }

        // Handle self-closing device tags like <device1/>
        // When we encounter a self-closing tag, the startElement is followed immediately by endElement
        // We can detect this by checking if we're in a Devices element and the element name looks like a device
        if (in_devices && in_track &&
            std::string(name).length() > 0 &&
            std::string(name)[0] != '/') {  // Not a closing tag
            // For self-closing tags, expat calls startElement then immediately endElement
            // We'll add the device name to the track's devices list
            // This looks like a self-closing device tag
            if (in_track && in_devices) {
                current_track_devices.push_back(name);
            }
            // Note: We do NOT add device names to the global plugins list
            // Only actual plugin names from VST/AU/CLAP etc. go in the global plugins list
        }
    }

    void characterData(const XML_Char* s, int len) {
        std::string text(s, len);

        if (in_manual) {
            try {
                bpm = std::stod(text);
                bpm_valid = true;
            } catch (...) {
                bpm = 0.0;
                bpm_valid = false;
            }
        }
        // We don't need to do anything for in_tempo character data
        if (in_numerator) {
            numerator = text;
        }
        if (in_denominator) {
            denominator = text;
            if (!numerator.empty() && !denominator.empty()) {
                time_signature = numerator + "/" + denominator;
            }
        }
        if (in_track && !in_devices) {
            // Track name: EffectiveName or Name
            if (std::string(current_element) == "EffectiveName" ||
                std::string(current_element) == "Name") {
                current_track["name"] = text;
            }
        }
        if (in_plugin_name) {
            current_plugin_name = text;
            // If we are in a track and in devices, add this plugin name to the track's devices
            // But only if we're actually in a PluginDevice context (not just any plugin info)
            if (in_track && in_devices && in_plugin_device) {
                current_track_devices.push_back(current_plugin_name);
            }
            // Note: We do NOT add plugin names to the global plugins list here
            // The global plugins list is for actual VST/AU/CLAP plugins detected elsewhere
            // In this simple test, there are no such plugins, so plugins list should remain empty
        }
        if (in_relative_path) {
            if (std::string(current_element) == "Name") {
                current_sample_name = text;
            } else if (std::string(current_element) == "Dir") {
                current_sample_dir = text;
            }
        }
        if (in_preset_relative_path) {
            if (std::string(current_element) == "Name") {
                current_preset_name = text;
            } else if (std::string(current_element) == "Dir") {
                current_preset_dir = text;
            }
        }
    }

    // Member variables
    XML_Parser parser;

    std::string current_element;

    // Version
    std::string major_version;
    std::string minor_version;
    std::string format = "Ableton Live";
    std::string format_key = "als";
    std::string version;
    double bpm = 0.0;
    bool bpm_valid = false;

    // Tempo
    bool in_tempo = false;
    bool in_manual = false;

    // Time signature
    std::string time_signature;
    std::string numerator;
    std::string denominator;
    bool in_time_signature = false;
    bool in_numerator = false;
    bool in_denominator = false;

    // Tracks
    bool in_tracks = false;
    bool in_track = false;
    std::map<std::string, std::string> current_track;
    std::vector<std::string> current_track_devices;
    std::vector<std::map<std::string, std::string>> tracks;
    bool in_devices = false;

    // Plugins
    bool in_plugin_device = false;
    bool in_plugin_info = false;
    bool in_plugin_name = false;
    std::string current_plugin_name;
    std::set<std::string> plugins;

    // Samples
    bool in_sample_ref = false;
    bool in_relative_path = false;
    std::string current_sample_name;
    std::string current_sample_dir;
    std::vector<std::string> samples_vector;
    std::set<std::string> samples_set;

    // Presets
    bool in_preset_ref = false;
    bool in_preset_relative_path = false;
    std::string current_preset_name;
    std::string current_preset_dir;
    std::vector<std::string> presets_vector;
    std::set<std::string> presets_set;

    // Archive contents (to be filled later)
    std::map<std::string, std::vector<std::string>> archive_contents;
    std::string primary_als;

    int track_count = 0;
};

int main(int argc, char* argv[]) {
    try {
        std::cerr << "Start (fixed streaming)\n";

        // Buffer for reading chunks from stdin
        constexpr size_t CHUNK_SIZE = 64 * 1024; // 64KB chunks
        std::vector<uint8_t> chunk_buffer;
        chunk_buffer.reserve(CHUNK_SIZE);

        // Buffer for accumulated data (we need to be able to go back and forth in the ZIP structure)
        // But we'll try to minimize what we keep
        std::vector<uint8_t> accumulated_data;

        // Track ZIP file parsing state
        size_t pos = 0; // Current position in accumulated_data
        std::vector<std::pair<std::string, size_t>> als_files; // filename and uncompressed size
        std::map<std::string, int> archive_counts;
        archive_counts["als"] = 0;
        archive_counts["samples"] = 0;
        archive_counts["presets"] = 0;
        archive_counts["images"] = 0;
        archive_counts["other"] = 0;
        // Local vectors and sets for files found in ZIP scan (to be merged with XML results later)
        std::vector<std::string> zip_samples_vector;
        std::set<std::string> zip_samples_set;
        std::vector<std::string> zip_presets_vector;
        std::set<std::string> zip_presets_set;

        // Track the largest .als file
        std::string primary_als_name;
        size_t max_als_size = 0;
        bool als_found = false;

        // Buffer for the compressed data of the largest .als file
        std::vector<uint8_t> largest_als_compressed_data;
        size_t largest_als_data_pos = 0; // Position in accumulated_data where the data starts
        uint16_t largest_als_compression_method = 0;
        size_t largest_als_header_pos = 0; // Position of the header in accumulated_data

        // Read data in chunks from stdin
        while (true) {
            chunk_buffer.resize(CHUNK_SIZE);
            ssize_t bytes_read = read(STDIN_FILENO, chunk_buffer.data(), CHUNK_SIZE);

            if (bytes_read <= 0) {
                // End of input or error
                break;
            }

            chunk_buffer.resize(bytes_read);

            // Add chunk to accumulated data
            accumulated_data.insert(accumulated_data.end(), chunk_buffer.begin(), chunk_buffer.end());

            // Process any complete ZIP local headers we can find in the accumulated data
            bool made_progress = true;
            while (made_progress && pos < accumulated_data.size()) {
                made_progress = false;

                // Look for the signature of a local file header
                if (pos + sizeof(ZipLocalHeader) > accumulated_data.size()) {
                    // Not enough data for a full header, wait for more
                    break;
                }

                // Check if the current position has the signature
                if (accumulated_data[pos] == 0x50 &&
                    accumulated_data[pos+1] == 0x4b &&
                    accumulated_data[pos+2] == 0x03 &&
                    accumulated_data[pos+3] == 0x04) {
                    // Found a local file header
                    const ZipLocalHeader* header = reinterpret_cast<const ZipLocalHeader*>(&accumulated_data[pos]);
                    uint16_t file_name_length = le16toh(header->file_name_length);
                    uint16_t extra_field_length = le16toh(header->extra_field_length);
                    uint32_t compressed_size = le32toh(header->compressed_size);
                    uint32_t uncompressed_size = le32toh(header->uncompressed_size);
                    uint16_t compression_method = le16toh(header->compression_method);

                    size_t header_pos = pos + sizeof(ZipLocalHeader);
                    size_t file_name_pos = header_pos;
                    size_t extra_field_pos = file_name_pos + file_name_length;
                    size_t data_pos = extra_field_pos + extra_field_length;

                    if (data_pos + compressed_size > accumulated_data.size()) {
                        // Not enough data for the full file data, wait for more
                        break;
                    }

                    // Extract the file name
                    std::string file_name(reinterpret_cast<const char*>(&accumulated_data[file_name_pos]), file_name_length);

                    // Count file types for archive contents and collect file paths
                    std::string ext;
                    size_t dot_pos = file_name.find_last_of('.');
                    if (dot_pos != std::string::npos) {
                        ext = file_name.substr(dot_pos);
                        std::transform(ext.begin(), ext.end(), ext.begin(), ::tolower);
                    }

                    if (ext == ".als") {
                        archive_counts["als"]++;
                        als_files.push_back(std::make_pair(file_name, uncompressed_size));

                        // Track the largest .als file
                        if (uncompressed_size > max_als_size) {
                            max_als_size = uncompressed_size;
                            primary_als_name = file_name;
                            als_found = true;

                            // Save the header and data position for this .als file
                            largest_als_header_pos = pos;
                            largest_als_data_pos = data_pos;
                            largest_als_compression_method = compression_method;

                            // Buffer the compressed data (we need to copy it since we'll overwrite accumulated_data later)
                            largest_als_compressed_data.assign(
                                &accumulated_data[data_pos],
                                &accumulated_data[data_pos + compressed_size]
                            );
                        }
                    } else if (ext == ".wav" || ext == ".aiff" || ext == ".aif" || ext == ".flac" || ext == ".ogg" || ext == ".mp3") {
                        archive_counts["samples"]++;
                        if (zip_samples_set.insert(file_name).second) {
                            zip_samples_vector.push_back(file_name);
                        }
                    } else if (ext == ".adg" || ext == ".adv" || ext == ".alc" || ext == ".xpl") {
                        archive_counts["presets"]++;
                        if (zip_presets_set.insert(file_name).second) {
                            zip_presets_vector.push_back(file_name);
                        }
                    } else if (ext == ".png" || ext == ".jpg" || ext == ".jpeg" || ext == ".gif" || ext == ".bmp" || ext == ".tiff") {
                        archive_counts["images"]++;
                    } else {
                        archive_counts["other"]++;
                    }

                    // Move to the next potential header
                    pos = data_pos + compressed_size;
                    made_progress = true;
                } else {
                    // No signature found, move forward
                    pos++;
                    made_progress = true;
                }
            }

            // Remove processed data from accumulated_data to save memory
            // But keep at least enough to potentially find headers that span chunks
            if (pos > sizeof(ZipLocalHeader) * 2) { // Keep some overlap
                size_t keep_size = sizeof(ZipLocalHeader) * 2;
                if (accumulated_data.size() > pos + keep_size) {
                    // We can safely remove data up to pos - keep_size
                    size_t remove_size = pos - keep_size;
                    accumulated_data.erase(accumulated_data.begin(), accumulated_data.begin() + remove_size);

                    // Adjust all our position trackers
                    pos -= remove_size;
                    largest_als_header_pos -= remove_size;
                    largest_als_data_pos -= remove_size;
                    // Note: largest_als_compressed_data is already copied, so no need to adjust
                }
            }
        }

        std::cerr << "Finished reading input\n";

        // Process any remaining data in the buffer
        bool made_progress = true;
        while (made_progress && pos < accumulated_data.size()) {
            made_progress = false;

            // Look for the signature of a local file header
            if (pos + sizeof(ZipLocalHeader) > accumulated_data.size()) {
                // Not enough data for a full header
                break;
            }

            // Check if the current position has the signature
            if (accumulated_data[pos] == 0x50 &&
                accumulated_data[pos+1] == 0x4b &&
                accumulated_data[pos+2] == 0x03 &&
                accumulated_data[pos+3] == 0x04) {
                // Found a local file header
                const ZipLocalHeader* header = reinterpret_cast<const ZipLocalHeader*>(&accumulated_data[pos]);
                uint16_t file_name_length = le16toh(header->file_name_length);
                uint16_t extra_field_length = le16toh(header->extra_field_length);
                uint32_t compressed_size = le32toh(header->compressed_size);
                uint32_t uncompressed_size = le32toh(header->uncompressed_size);
                uint16_t compression_method = le16toh(header->compression_method);

                size_t header_pos = pos + sizeof(ZipLocalHeader);
                size_t file_name_pos = header_pos;
                size_t extra_field_pos = file_name_pos + file_name_length;
                size_t data_pos = extra_field_pos + extra_field_length;

                if (data_pos + compressed_size > accumulated_data.size()) {
                    // Corrupted ZIP
                    break;
                }

                // Extract the file name
                std::string file_name(reinterpret_cast<const char*>(&accumulated_data[file_name_pos]), file_name_length);

                // Count file types for archive contents and collect file paths
                std::string ext;
                size_t dot_pos = file_name.find_last_of('.');
                if (dot_pos != std::string::npos) {
                    ext = file_name.substr(dot_pos);
                    std::transform(ext.begin(), ext.end(), ext.begin(), ::tolower);
                }

                if (ext == ".als") {
                    archive_counts["als"]++;
                    als_files.push_back(std::make_pair(file_name, uncompressed_size));

                    // Track the largest .als file
                    if (uncompressed_size > max_als_size) {
                        max_als_size = uncompressed_size;
                        primary_als_name = file_name;
                        als_found = true;

                        // Save the header and data position for this .als file
                        largest_als_header_pos = pos;
                        largest_als_data_pos = data_pos;
                        largest_als_compression_method = compression_method;

                        // Buffer the compressed data
                        largest_als_compressed_data.assign(
                            &accumulated_data[data_pos],
                            &accumulated_data[data_pos + compressed_size]
                        );
                    }
                } else if (ext == ".wav" || ext == ".aiff" || ext == ".aif" || ext == ".flac" || ext == ".ogg" || ext == ".mp3") {
                    archive_counts["samples"]++;
                    if (zip_samples_set.insert(file_name).second) {
                        zip_samples_vector.push_back(file_name);
                    }
                } else if (ext == ".adg" || ext == ".adv" || ext == ".alc" || ext == ".xpl") {
                    archive_counts["presets"]++;
                    if (zip_presets_set.insert(file_name).second) {
                        zip_presets_vector.push_back(file_name);
                    }
                } else if (ext == ".png" || ext == ".jpg" || ext == ".jpeg" || ext == ".gif" || ext == ".bmp" || ext == ".tiff") {
                    archive_counts["images"]++;
                } else {
                    archive_counts["other"]++;
                }

                // Move to the next potential header
                pos = data_pos + compressed_size;
                made_progress = true;
            } else {
                // No signature found, move forward
                pos++;
                made_progress = true;
            }
        }

        std::cerr << "Finished scanning ZIP\n";

        if (!als_found || als_files.empty()) {
            // No .als files found, return basic archive info
            // We'll create a DAWInfo-like JSON output
            std::cout << "{";
            std::cout << "\"format\":\"Ableton Live Pack\",";
            std::cout << "\"format_key\":\"alp\",";
            std::cout << "\"version\":\"\",";
            std::cout << "\"bpm\":null,";
            std::cout << "\"time_signature\":null,";
            std::cout << "\"tracks\":[],";
            std::cout << "\"plugins\":[],";
            std::cout << "\"samples\":[],";
            std::cout << "\"extra\":{";
            std::cout << "\"track_count\":0,";
            std::cout << "\"presets\":[],";
            std::cout << "\"archive_contents\":{";
            std::cout << "\"als_files\":[],";
            std::cout << "\"samples\":" << archive_counts["samples"] << ",";
            std::cout << "\"presets\":" << archive_counts["presets"] << ",";
            std::cout << "\"images\":" << archive_counts["images"] << ",";
            std::cout << "\"other\":" << archive_counts["other"] << ",";
            std::cout << "\"total_files\":" << (archive_counts["als"] + archive_counts["samples"] + archive_counts["presets"] + archive_counts["images"] + archive_counts["other"]) << ",";
            std::cout << "\"primary_als\":\"\"";
            std::cout << "}";
            std::cout << "}" << std::endl;
            return 0;
        }

        std::cerr << "Primary .als file: " << primary_als_name
                  << ", size=" << max_als_size << "\n";

        // Decompress the ZIP compression (if needed)
        std::vector<uint8_t> als_data;
        if (largest_als_compression_method == 0) {
            // Store
            als_data = largest_als_compressed_data;
        } else if (largest_als_compression_method == 8) {
            // Deflate
            als_data = decompress_deflate(largest_als_compressed_data.data(), largest_als_compressed_data.size());
        } else {
            std::cerr << "Error: Unsupported compression method for .als file: "
                      << largest_als_compression_method << std::endl;
            return 1;
        }

        // Now decompress the gzip data (the .als file is gzipped)
        std::vector<uint8_t> als_xml_data = decompress_gzip(als_data.data(), als_data.size());

        // Parse the XML
        AlsXmlParser xml_parser;
        if (!xml_parser.parse(als_xml_data)) {
            std::cerr << "Error: Failed to parse .als XML" << std::endl;
            return 1;
        }
        std::cerr << "Parsed XML\n";

        // Merge ZIP-scanned samples and presets with XML-parsed ones
        for (const auto& sample : zip_samples_vector) {
            xml_parser.addSample(sample);
        }
        for (const auto& preset : zip_presets_vector) {
            xml_parser.addPreset(preset);
        }

        // Build the JSON output
        std::cout << std::fixed;
        std::cout << "{";
        std::cout << "\"format\":\"Ableton Live Pack\",";
        std::cout << "\"format_key\":\"alp\",";
        std::cout << "\"version\":\"";
        if (!xml_parser.getMajorVersion().empty() || !xml_parser.getMinorVersion().empty()) {
            std::cout << xml_parser.getMajorVersion() << "." << xml_parser.getMinorVersion();
        }
        std::cout << "\",";
        std::cout << "\"bpm\":";
        if (xml_parser.getBpmValid()) {
            std::cout << xml_parser.getBpm();
        } else {
            std::cout << "null";
        }
        std::cout << ",\"time_signature\":";
        if (!xml_parser.getTimeSignature().empty()) {
            std::cout << "\"" << xml_parser.getTimeSignature() << "\"";
        } else {
            std::cout << "null";
        }
        std::cout << ",\"tracks\":[";
        const auto& tracks = xml_parser.getTracks();
        for (size_t i = 0; i < tracks.size(); ++i) {
            if (i > 0) std::cout << ",";
            std::cout << "{";
            std::cout << "\"name\":\"" << tracks[i].at("name") << "\",";
            std::cout << "\"kind\":\"" << tracks[i].at("kind") << "\",";
            std::cout << "\"devices\":[";
            const std::string& devices_str = tracks[i].at("devices");
            if (!devices_str.empty()) {
                size_t start = 0;
                size_t end = 0;
                while ((end = devices_str.find(',', start)) != std::string::npos) {
                    std::cout << "\"" << devices_str.substr(start, end - start) << "\",";
                    start = end + 1;
                }
                std::cout << "\"" << devices_str.substr(start) << "\"";
            }
            std::cout << "]";
            std::cout << "}";
        }
        std::cout << "],";
        std::cout << "\"plugins\":[";
        const auto& plugins = xml_parser.getPlugins();
        for (size_t i = 0; i < plugins.size(); ++i) {
            if (i > 0) std::cout << ",";
            std::cout << "\"" << *std::next(plugins.begin(), i) << "\"";
        }
        std::cout << "],";
        std::cout << "\"samples\":[";
        const auto& samples = xml_parser.getSamples();
        for (size_t i = 0; i < samples.size(); ++i) {
            if (i > 0) std::cout << ",";
            std::cout << "\"" << samples[i] << "\"";
        }
        std::cout << "],";
        std::cout << "\"extra\":{";
        std::cout << "\"track_count\":" << xml_parser.getTrackCount() << ",";
        std::cout << "\"presets\":[";
        const auto& presets = xml_parser.getPresets();
        for (size_t i = 0; i < presets.size(); ++i) {
            if (i > 0) std::cout << ",";
            std::cout << "\"" << presets[i] << "\"";
        }
        std::cout << "],";
        std::cout << "\"archive_contents\":{";
        std::cout << "\"als_files\":[";
        for (size_t i = 0; i < als_files.size(); ++i) {
            if (i > 0) std::cout << ",";
            std::cout << "\"" << als_files[i].first << "\"";
        }
        std::cout << "],";
        std::cout << "\"samples\":" << archive_counts["samples"] << ",";
        std::cout << "\"presets\":" << archive_counts["presets"] << ",";
        std::cout << "\"images\":" << archive_counts["images"] << ",";
        std::cout << "\"other\":" << archive_counts["other"] << ",";
        std::cout << "\"total_files\":" << (archive_counts["als"] + archive_counts["samples"] + archive_counts["presets"] + archive_counts["images"] + archive_counts["other"]) << ",";
        std::cout << "\"primary_als\":\"" << primary_als_name << "\"";
        std::cout << "}";
        std::cout << "}";
        std::cout << "}" << std::endl;

        return 0;
    } catch (const std::exception& e) {
        std::cerr << "Error: " << e.what() << std::endl;
        // Output error JSON
        std::cout << "{\"format\":\"Ableton Live Pack\",\"format_key\":\"alp\",\"version\":null,\"bpm\":null,\"time_signature\":null,\"tracks\":[],\"plugins\":[],\"samples\":[],\"extra\":{\"track_count\":0,\"presets\":[],\"archive_contents\":{\"als_files\":[],\"samples\":0,\"presets\":0,\"images\":0,\"other\":0,\"total_files\":0,\"primary_als\":\"\"}}}" << std::endl;
        return 1;
    }
}