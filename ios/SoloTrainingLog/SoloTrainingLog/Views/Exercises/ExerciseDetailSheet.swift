import SwiftUI

struct ExerciseDetailSheet: View {
    let exercise: Exercise
    @Environment(\.dismiss) var dismiss

    var body: some View {
        NavigationStack {
            ZStack {
                Theme.Colors.surface.ignoresSafeArea()

                ScrollView {
                    VStack(alignment: .leading, spacing: 20) {
                        // Header
                        HStack {
                            CategoryBadge(category: exercise.category)
                            if exercise.isCustom {
                                Text("Custom Exercise")
                                    .font(Theme.Fonts.labelSmall)
                                    .foregroundStyle(Theme.Colors.tertiary)
                                    .padding(.horizontal, 8)
                                    .padding(.vertical, 4)
                                    .background(Theme.Colors.tertiaryContainer)
                                    .clipShape(Capsule())
                            }
                        }

                        // Equipment
                        if let equipment = exercise.equipment as? [String], !equipment.isEmpty {
                            DetailSection(title: "Equipment") {
                                FlowLayout(items: equipment)
                            }
                        }

                        // Muscles
                        if let muscles = exercise.muscles as? [String], !muscles.isEmpty {
                            DetailSection(title: "Muscles") {
                                FlowLayout(items: muscles)
                            }
                        }

                        // Instructions
                        if !exercise.instructions.isEmpty {
                            DetailSection(title: "Instructions") {
                                Text(exercise.instructions)
                                    .font(Theme.Fonts.bodyMedium)
                                    .foregroundStyle(Theme.Colors.onSurface)
                            }
                        }

                        // Progress link
                        NavigationLink(destination: ProgressChartView(exercise: exercise)) {
                            HStack {
                                Image(systemName: "chart.xyaxis.line")
                                Text("View Progress")
                                Spacer()
                                Image(systemName: "chevron.right")
                            }
                            .font(Theme.Fonts.labelLarge)
                            .foregroundStyle(Theme.Colors.primary)
                            .padding(16)
                            .background(Theme.Colors.primaryContainer.opacity(0.3))
                            .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.sm))
                        }
                    }
                    .padding(20)
                }
            }
            .navigationTitle(exercise.name)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Done") { dismiss() }
                        .foregroundStyle(Theme.Colors.primary)
                }
            }
        }
    }
}

struct DetailSection<Content: View>: View {
    let title: String
    @ViewBuilder let content: Content

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title.uppercased())
                .font(Theme.Fonts.labelSmall)
                .foregroundStyle(Theme.Colors.onSurfaceVariant)
                .tracking(1)
            content
        }
    }
}

struct FlowLayout: View {
    let items: [String]

    var body: some View {
        // Simple wrapping layout using horizontal stacking
        LazyVGrid(columns: [GridItem(.adaptive(minimum: 80))], alignment: .leading, spacing: 6) {
            ForEach(items, id: \.self) { item in
                Text(item)
                    .font(Theme.Fonts.labelMedium)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 5)
                    .background(Theme.Colors.surfaceContainer)
                    .foregroundStyle(Theme.Colors.onSurface)
                    .clipShape(Capsule())
            }
        }
    }
}
