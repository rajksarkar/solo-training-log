import SwiftUI

extension Theme {
    enum Fonts {
        // Display headings — Instrument Serif (italic)
        // Falls back to system serif if custom font not bundled
        static let displayLarge = Font.custom("InstrumentSerif-Italic", size: 32, relativeTo: .largeTitle)
        static let displayMedium = Font.custom("InstrumentSerif-Italic", size: 28, relativeTo: .title)
        static let displaySmall = Font.custom("InstrumentSerif-Italic", size: 24, relativeTo: .title2)

        // Body text — DM Sans
        static let titleLarge = Font.custom("DMSans-SemiBold", size: 20, relativeTo: .title3)
        static let titleMedium = Font.custom("DMSans-SemiBold", size: 16, relativeTo: .headline)
        static let titleSmall = Font.custom("DMSans-Medium", size: 14, relativeTo: .subheadline)

        static let bodyLarge = Font.custom("DMSans-Regular", size: 16, relativeTo: .body)
        static let bodyMedium = Font.custom("DMSans-Regular", size: 14, relativeTo: .callout)
        static let bodySmall = Font.custom("DMSans-Regular", size: 12, relativeTo: .caption)

        static let labelLarge = Font.custom("DMSans-Medium", size: 14, relativeTo: .subheadline)
        static let labelMedium = Font.custom("DMSans-Medium", size: 12, relativeTo: .caption)
        static let labelSmall = Font.custom("DMSans-Medium", size: 11, relativeTo: .caption2)
    }
}
