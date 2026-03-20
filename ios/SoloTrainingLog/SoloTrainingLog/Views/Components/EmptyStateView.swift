import SwiftUI

struct EmptyStateView: View {
    let icon: String
    let title: String
    let message: String
    var action: (() -> Void)?
    var actionLabel: String?

    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: icon)
                .font(.system(size: 48))
                .foregroundStyle(Theme.Colors.outlineVariant)
            Text(title)
                .font(Theme.Fonts.titleMedium)
                .foregroundStyle(Theme.Colors.onSurface)
            Text(message)
                .font(Theme.Fonts.bodySmall)
                .foregroundStyle(Theme.Colors.onSurfaceVariant)
                .multilineTextAlignment(.center)
            if let action, let actionLabel {
                Button(action: action) {
                    Text(actionLabel)
                        .font(Theme.Fonts.labelLarge)
                        .foregroundStyle(Theme.Colors.onPrimary)
                        .padding(.horizontal, 24)
                        .padding(.vertical, 12)
                        .background(Theme.Colors.primary)
                        .clipShape(Capsule())
                }
            }
        }
        .padding(32)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}
