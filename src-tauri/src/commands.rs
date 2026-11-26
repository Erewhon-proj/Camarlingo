//! Tauri commands: each one calls an application service and returns its result as is.

use camarlingo_app::about::{self, AppInfo};

#[tauri::command]
pub fn app_info() -> AppInfo {
    about::app_info()
}
