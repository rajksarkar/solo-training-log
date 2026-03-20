import SwiftUI

enum ExerciseCategory: String, Codable, CaseIterable, Identifiable {
    case strength
    case cardio
    case zone2
    case pilates
    case mobility
    case plyometrics
    case stretching
    case other

    var id: String { rawValue }

    var displayName: String {
        switch self {
        case .zone2: return "Zone 2"
        default: return rawValue.capitalized
        }
    }

    var icon: String {
        switch self {
        case .strength: return "dumbbell.fill"
        case .cardio: return "heart.fill"
        case .zone2: return "waveform.path.ecg"
        case .pilates: return "figure.pilates"
        case .mobility: return "figure.flexibility"
        case .plyometrics: return "figure.jumprope"
        case .stretching: return "figure.cooldown"
        case .other: return "ellipsis.circle.fill"
        }
    }

    var backgroundColor: Color {
        switch self {
        case .strength: return Color(hex: "#d4f5e2")
        case .cardio: return Color(hex: "#fce4e0")
        case .zone2: return Color(hex: "#d4f0ea")
        case .pilates: return Color(hex: "#f5dce0")
        case .mobility: return Color(hex: "#f5ead8")
        case .plyometrics: return Color(hex: "#e0e8ee")
        case .stretching: return Color(hex: "#e8f0e9")
        case .other: return Color(hex: "#ece8e2")
        }
    }

    var textColor: Color {
        switch self {
        case .strength: return Color(hex: "#0d2b1a")
        case .cardio: return Color(hex: "#5a1009")
        case .zone2: return Color(hex: "#0d2b22")
        case .pilates: return Color(hex: "#3d1722")
        case .mobility: return Color(hex: "#3d2e17")
        case .plyometrics: return Color(hex: "#1a2e3d")
        case .stretching: return Color(hex: "#2a3a2d")
        case .other: return Color(hex: "#3d3a35")
        }
    }

    var accentColor: Color {
        switch self {
        case .strength: return Color(hex: "#1a5c3a")
        case .cardio: return Color(hex: "#c4321d")
        case .zone2: return Color(hex: "#3d8b7a")
        case .pilates: return Color(hex: "#b85c6b")
        case .mobility: return Color(hex: "#8b7355")
        case .plyometrics: return Color(hex: "#4a6b8a")
        case .stretching: return Color(hex: "#5c6b5e")
        case .other: return Color(hex: "#8a9089")
        }
    }
}
