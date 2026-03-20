import SwiftUI

struct CategoryBadge: View {
    let category: ExerciseCategory

    var body: some View {
        HStack(spacing: 4) {
            Image(systemName: category.icon)
                .font(.system(size: 10))
            Text(category.displayName)
                .font(Theme.Fonts.labelSmall)
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 4)
        .background(category.backgroundColor)
        .foregroundStyle(category.textColor)
        .clipShape(Capsule())
    }
}
