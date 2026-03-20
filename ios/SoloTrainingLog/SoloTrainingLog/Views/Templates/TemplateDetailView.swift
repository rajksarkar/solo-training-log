import SwiftUI

struct TemplateDetailView: View {
    let templateId: String
    @State private var template: SessionTemplate?
    @State private var isLoading = true
    @State private var showAddExercise = false
    @State private var errorMessage: String?

    var body: some View {
        ZStack {
            Theme.Colors.surface.ignoresSafeArea()

            if isLoading {
                LoadingView()
            } else if let template {
                ScrollView {
                    VStack(spacing: 16) {
                        // Header
                        VStack(alignment: .leading, spacing: 8) {
                            CategoryBadge(category: template.category)
                            if let notes = template.notes, !notes.isEmpty {
                                Text(notes)
                                    .font(Theme.Fonts.bodySmall)
                                    .foregroundStyle(Theme.Colors.onSurfaceVariant)
                            }
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(16)
                        .cardStyle()

                        // Exercises
                        if let exercises = template.exercises, !exercises.isEmpty {
                            VStack(alignment: .leading, spacing: 12) {
                                Text("EXERCISES")
                                    .font(Theme.Fonts.labelSmall)
                                    .foregroundStyle(Theme.Colors.onSurfaceVariant)
                                    .tracking(1)

                                ForEach(exercises) { te in
                                    HStack(spacing: 12) {
                                        Text("\(te.order + 1)")
                                            .font(Theme.Fonts.labelMedium)
                                            .foregroundStyle(Theme.Colors.onSurfaceVariant)
                                            .frame(width: 24)

                                        VStack(alignment: .leading, spacing: 2) {
                                            Text(te.exercise?.name ?? "Exercise")
                                                .font(Theme.Fonts.titleSmall)
                                                .foregroundStyle(Theme.Colors.onSurface)
                                            HStack(spacing: 8) {
                                                if let sets = te.defaultSets, let reps = te.defaultReps {
                                                    Text("\(sets) x \(reps)")
                                                        .font(Theme.Fonts.labelSmall)
                                                        .foregroundStyle(Theme.Colors.onSurfaceVariant)
                                                }
                                                if let weight = te.defaultWeight {
                                                    Text("@ \(String(format: "%.0f", weight)) lb")
                                                        .font(Theme.Fonts.labelSmall)
                                                        .foregroundStyle(Theme.Colors.tertiary)
                                                }
                                                if let dur = te.defaultDurationSec {
                                                    Text("\(dur)s")
                                                        .font(Theme.Fonts.labelSmall)
                                                        .foregroundStyle(Theme.Colors.onSurfaceVariant)
                                                }
                                            }
                                        }
                                        Spacer()
                                    }
                                    .padding(.vertical, 8)

                                    if te.id != exercises.last?.id {
                                        Divider()
                                            .foregroundStyle(Theme.Colors.outlineVariant.opacity(0.5))
                                    }
                                }
                            }
                            .padding(16)
                            .cardStyle()
                        } else {
                            EmptyStateView(
                                icon: "plus.circle",
                                title: "No exercises",
                                message: "Add exercises to this template",
                                action: { showAddExercise = true },
                                actionLabel: "Add Exercise"
                            )
                            .frame(height: 200)
                        }

                        // Add exercise button
                        Button {
                            showAddExercise = true
                        } label: {
                            HStack {
                                Image(systemName: "plus.circle.fill")
                                Text("Add Exercise")
                            }
                            .font(Theme.Fonts.labelLarge)
                            .foregroundStyle(Theme.Colors.primary)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 14)
                            .background(Theme.Colors.primaryContainer.opacity(0.3))
                            .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.sm))
                        }

                        // Start session button
                        NavigationLink {
                            // This will create a session from template
                        } label: {
                            Text("Start Session")
                                .font(Theme.Fonts.labelLarge)
                                .foregroundStyle(Theme.Colors.onPrimary)
                                .frame(maxWidth: .infinity)
                                .frame(height: 48)
                                .background(Theme.Colors.primary)
                                .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.xl))
                        }
                    }
                    .padding(16)
                }
            }
        }
        .navigationTitle(template?.title ?? "Template")
        .navigationBarTitleDisplayMode(.inline)
        .sheet(isPresented: $showAddExercise) {
            AddExerciseSheet { exerciseId in
                Task { await addExercise(exerciseId: exerciseId) }
            }
        }
        .task { await loadTemplate() }
    }

    private func loadTemplate() async {
        isLoading = true
        do {
            template = try await TemplateService.get(id: templateId)
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }

    private func addExercise(exerciseId: String) async {
        let order = template?.exercises?.count ?? 0
        do {
            let _ = try await TemplateService.addExercise(
                templateId: templateId,
                request: AddTemplateExerciseRequest(exerciseId: exerciseId, order: order)
            )
            await loadTemplate()
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}
