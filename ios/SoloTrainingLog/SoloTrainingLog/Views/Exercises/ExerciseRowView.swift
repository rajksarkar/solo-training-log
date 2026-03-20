import SwiftUI

struct ExerciseRowView: View {
    let exercise: Exercise

    var body: some View {
        HStack(spacing: 12) {
            // Category icon
            Image(systemName: exercise.category.icon)
                .font(.system(size: 16))
                .foregroundStyle(exercise.category.accentColor)
                .frame(width: 36, height: 36)
                .background(exercise.category.backgroundColor)
                .clipShape(RoundedRectangle(cornerRadius: 8))

            VStack(alignment: .leading, spacing: 2) {
                Text(exercise.name)
                    .font(Theme.Fonts.titleSmall)
                    .foregroundStyle(Theme.Colors.onSurface)
                    .lineLimit(1)

                HStack(spacing: 6) {
                    CategoryBadge(category: exercise.category)
                    if exercise.isCustom {
                        Text("Custom")
                            .font(Theme.Fonts.labelSmall)
                            .foregroundStyle(Theme.Colors.tertiary)
                    }
                }
            }

            Spacer()

            Image(systemName: "chevron.right")
                .font(.system(size: 12))
                .foregroundStyle(Theme.Colors.outlineVariant)
        }
        .padding(.vertical, 4)
    }
}
