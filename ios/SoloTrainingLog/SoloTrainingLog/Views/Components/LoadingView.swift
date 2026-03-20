import SwiftUI

struct LoadingView: View {
    var message: String = "Loading..."

    var body: some View {
        VStack(spacing: 12) {
            ProgressView()
                .tint(Theme.Colors.primary)
            Text(message)
                .font(Theme.Fonts.bodySmall)
                .foregroundStyle(Theme.Colors.onSurfaceVariant)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Theme.Colors.surface)
    }
}
