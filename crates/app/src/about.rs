//! Name and version of the application, shown in the user interface.

use serde::Serialize;

/// Display name of the application.
pub const APP_NAME: &str = "Camarlingo";

/// What the user interface shows about the running application.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct AppInfo {
    pub name: String,
    pub version: String,
}

/// Returns the name and the version of the application.
///
/// The version comes from the workspace manifest (`Cargo.toml`), the same one the
/// desktop installers use, so it changes in one place only.
#[must_use]
pub fn app_info() -> AppInfo {
    AppInfo {
        name: APP_NAME.to_owned(),
        version: env!("CARGO_PKG_VERSION").to_owned(),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn app_info_has_the_product_name() {
        // arrange
        let expected_name = "Camarlingo";

        // act
        let info = app_info();

        // assert
        assert_eq!(info.name, expected_name);
    }

    #[test]
    fn app_info_version_has_three_numeric_parts() {
        // arrange
        let expected_parts = 3;

        // act
        let info = app_info();

        // assert
        let parts: Vec<&str> = info.version.split('.').collect();
        assert_eq!(parts.len(), expected_parts);
        assert!(parts.iter().all(|part| part.parse::<u32>().is_ok()));
    }
}
