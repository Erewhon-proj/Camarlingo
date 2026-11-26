//! Application services of Camarlingo.
//!
//! Services depend on traits, never on Tauri or on a concrete database, so the desktop
//! shell and any other front end call the same code. Concrete implementations are
//! chosen at startup.

pub mod about;
