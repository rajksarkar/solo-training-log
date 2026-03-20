import SwiftUI

enum Theme {
    // Spacing
    enum Spacing {
        static let xs: CGFloat = 4
        static let sm: CGFloat = 8
        static let md: CGFloat = 12
        static let lg: CGFloat = 16
        static let xl: CGFloat = 20
        static let xxl: CGFloat = 24
        static let xxxl: CGFloat = 32
    }

    // Corner Radius
    enum Radius {
        static let xs: CGFloat = 6
        static let sm: CGFloat = 10
        static let md: CGFloat = 14
        static let lg: CGFloat = 20
        static let xl: CGFloat = 28
    }

    // Shadows
    static func elevation1() -> some View {
        EmptyView()
    }
}

// MARK: - View Modifiers

struct CardStyle: ViewModifier {
    func body(content: Content) -> some View {
        content
            .background(Theme.Colors.surfaceContainerLowest)
            .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.md))
            .shadow(color: Color(hex: "#1a2c22").opacity(0.06), radius: 1.5, y: 1)
            .shadow(color: Color(hex: "#1a2c22").opacity(0.08), radius: 1, y: 1)
    }
}

struct ElevatedCardStyle: ViewModifier {
    func body(content: Content) -> some View {
        content
            .background(Theme.Colors.surfaceContainerLowest)
            .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.md))
            .shadow(color: Color(hex: "#1a2c22").opacity(0.08), radius: 3, y: 3)
            .shadow(color: Color(hex: "#1a2c22").opacity(0.06), radius: 2, y: 2)
    }
}

extension View {
    func cardStyle() -> some View {
        modifier(CardStyle())
    }

    func elevatedCardStyle() -> some View {
        modifier(ElevatedCardStyle())
    }
}
