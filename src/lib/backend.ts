// The only module that knows how the user interface reaches the Rust services.
// Pages and components import these functions and never call `invoke` directly.
import { invoke } from '@tauri-apps/api/core';

export type AppInfo = {
	name: string;
	version: string;
};

export function getAppInfo(): Promise<AppInfo> {
	return invoke<AppInfo>('app_info');
}
