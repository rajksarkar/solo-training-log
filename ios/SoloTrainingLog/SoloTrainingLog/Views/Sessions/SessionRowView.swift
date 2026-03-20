import SwiftUI

struct SessionRowView: View {
    let session: Session

    private var formattedDate: String {
        // Parse ISO date and format nicely
        let dateStr = String(session.date.prefix(10))
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        guard let date = formatter.date(from: dateStr) else { return dateStr }
        formatter.dateStyle = .medium
        return formatter.string(from: date)
    }

    var body: some View {
        HStack(spacing: 12) {
            // Category indicator
            RoundedRectangle(cornerRadius: 3)
                .fill(session.category.accentColor)
                .frame(width: 4, height: 40)

            VStack(alignment: .leading, spacing: 4) {
                Text(session.title)
                    .font(Theme.Fonts.titleSmall)
                    .foregroundStyle(Theme.Colors.onSurface)
                    .lineLimit(1)

                HStack(spacing: 8) {
                    CategoryBadge(category: session.category)
                    Text(formattedDate)
                        .font(Theme.Fonts.labelSmall)
                        .foregroundStyle(Theme.Colors.onSurfaceVariant)
                }
            }

            Spacer()

            if let exercises = session.exercises {
                Text("\(exercises.count)")
                    .font(Theme.Fonts.labelMedium)
                    .foregroundStyle(Theme.Colors.onSurfaceVariant)
                +
                Text(" exercises")
                    .font(Theme.Fonts.labelSmall)
                    .foregroundStyle(Theme.Colors.onSurfaceVariant)
            }
        }
        .padding(.vertical, 4)
    }
}
