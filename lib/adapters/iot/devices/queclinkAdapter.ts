/**
 * Queclink Direct Device Adapter
 * 
 * Direct integration with Queclink GPS devices (GV350MG, etc.)
 * First 4G device approved by CITC in Saudi Arabia.
 * 
 * Note: For most use cases, use a universal platform adapter (Navixy, Wialon, Flespi)
 * which already supports Queclink devices. This adapter is for direct device
 * communication scenarios (custom server, local deployment).
 * 
 * @module adapters/iot/devices/queclink
 */

export { createNavixyAdapter as createQueclinkAdapter } from '../platforms/navixyAdapter';
export { NavixyAdapter as QueclinkAdapter } from '../platforms/navixyAdapter';

// For direct Queclink server integration, implement a custom adapter
// that handles Queclink @NTC protocol messages
