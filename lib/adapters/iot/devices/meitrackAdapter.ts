/**
 * Meitrack Direct Device Adapter
 * 
 * Direct integration with Meitrack GPS devices (T633L-G, etc.)
 * CITC licensed for Saudi Arabia.
 * 
 * Note: For most use cases, use a universal platform adapter (Navixy, Wialon, Flespi)
 * which already supports Meitrack devices. This adapter is for direct device
 * communication scenarios (custom server, local deployment).
 * 
 * @module adapters/iot/devices/meitrack
 */

export { createNavixyAdapter as createMeitrackAdapter } from '../platforms/navixyAdapter';
export { NavixyAdapter as MeitrackAdapter } from '../platforms/navixyAdapter';

// For direct Meitrack server integration, implement a custom adapter
// that handles MEITRACK protocol messages
