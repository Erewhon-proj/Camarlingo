//! Desktop shell of Camarlingo.
//!
//! It only wires the Tauri commands to the application services. No logic lives here:
//! the pipeline does not build this crate, so anything untested here stays untested.

mod commands;

/// Starts the desktop application.
///
/// # Panics
///
/// Panics if Tauri cannot start, for example when the system webview is missing.
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![commands::app_info])
        .run(tauri::generate_context!())
        .expect("error while running the Camarlingo desktop application");
}
