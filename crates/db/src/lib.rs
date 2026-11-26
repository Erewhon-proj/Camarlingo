//! Data access of Camarlingo: one SQLite file per condominium plus `studio.db`.
//!
//! Each repository trait declared by the application services gets its SQLite
//! implementation here, so the services never depend on the database directly.
