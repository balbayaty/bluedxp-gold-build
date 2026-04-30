/**
 * IoT GPS Device Adapter Layer
 * 
 * Universal adapter for integrating GPS tracking devices from multiple providers:
 * 
 * UNIVERSAL PLATFORMS (Aggregate 300+ device types):
 * - Wialon (Gurtam) - 2,500+ device types
 * - Flespi - 500+ manufacturers  
 * - Navixy - 300+ devices, Saudi-hosted (PDPL compliant)
 * 
 * DIRECT DEVICE MANUFACTURERS (TGA/CST Approved):
 * - Teltonika (FMC800, FMC150) - CST certified
 * - Queclink (GV350MG) - First 4G device approved by CITC
 * - Meitrack (T633L-G) - CITC licensed
 * - Saferoad (Astrolabe) - Saudi-made
 * 
 * MANDATORY GOVERNMENT INTEGRATION:
 * - Daleeli (ELM Rabet) - Official TGA telematics
 * - WASL - TGA fleet registration
 * 
 * @module adapters/iot
 */

// Base interfaces
export * from './base/IotDeviceAdapter';

// Universal platform adapters
export * from './platforms/wialonAdapter';
export * from './platforms/navixyAdapter';
export * from './platforms/flespiAdapter';

// Direct device adapters
export * from './devices/teltonikaAdapter';
export * from './devices/queclinkAdapter';
export * from './devices/meitrackAdapter';

// Unified service
export * from './unifiedIotService';
