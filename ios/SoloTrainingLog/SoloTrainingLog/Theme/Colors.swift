import SwiftUI

extension Theme {
    enum Colors {
        // Primary
        static let primary = Color(hex: "#1a5c3a")
        static let onPrimary = Color.white
        static let primaryContainer = Color(hex: "#d4f5e2")
        static let onPrimaryContainer = Color(hex: "#0d2b1a")

        // Secondary
        static let secondary = Color(hex: "#5c6b5e")
        static let onSecondary = Color.white
        static let secondaryContainer = Color(hex: "#e8f0e9")
        static let onSecondaryContainer = Color(hex: "#2a3a2d")

        // Tertiary
        static let tertiary = Color(hex: "#8b7355")
        static let onTertiary = Color.white
        static let tertiaryContainer = Color(hex: "#f5ead8")
        static let onTertiaryContainer = Color(hex: "#3d2e17")

        // Surface
        static let surface = Color(hex: "#f7f4f0")
        static let onSurface = Color(hex: "#1a1c1a")
        static let onSurfaceVariant = Color(hex: "#5c635d")
        static let surfaceContainerLowest = Color(hex: "#faf8f5")
        static let surfaceContainerLow = Color(hex: "#f2efe9")
        static let surfaceContainer = Color(hex: "#ece8e2")
        static let surfaceContainerHigh = Color(hex: "#e5e1da")
        static let surfaceContainerHighest = Color(hex: "#dedad3")

        // Outline
        static let outline = Color(hex: "#8a9089")
        static let outlineVariant = Color(hex: "#cdd1ca")

        // Inverse
        static let inverseSurface = Color(hex: "#1a2e22")
        static let inverseOnSurface = Color(hex: "#e8ede9")
        static let inversePrimary = Color(hex: "#7dd4a3")

        // Error
        static let error = Color(hex: "#c4321d")
        static let onError = Color.white
        static let errorContainer = Color(hex: "#fce4e0")
        static let onErrorContainer = Color(hex: "#5a1009")
    }
}

extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet(charactersIn: "#"))
        let scanner = Scanner(string: hex)
        var rgbValue: UInt64 = 0
        scanner.scanHexInt64(&rgbValue)
        let r = Double((rgbValue & 0xFF0000) >> 16) / 255.0
        let g = Double((rgbValue & 0x00FF00) >> 8) / 255.0
        let b = Double(rgbValue & 0x0000FF) / 255.0
        self.init(red: r, green: g, blue: b)
    }
}
