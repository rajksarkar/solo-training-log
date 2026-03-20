import SwiftUI

struct SessionDetailView: View {
    @StateObject private var viewModel: SessionDetailViewModel
    @State private var showAddExercise = false
    @State private var editingLogs: [String: [EditableSetLog]] = [:] // keyed by sessionExerciseId

    init(sessionId: String) {
        _viewModel = StateObject(wrappedValue: SessionDetailViewModel(sessionId: sessionId))
    }

    var body: some View {
        ZStack {
            Theme.Colors.surface.ignoresSafeArea()

            if viewModel.isLoading && viewModel.session == nil {
                LoadingView()
            } else if let session = viewModel.session {
                ScrollView {
                    VStack(spacing: 16) {
                        // Session header
                        VStack(alignment: .leading, spacing: 8) {
                            HStack {
                                CategoryBadge(category: session.category)
                                Spacer()
                                if viewModel.isSaving {
                                    HStack(spacing: 4) {
                                        ProgressView()
                                            .scaleEffect(0.7)
                                        Text("Saving...")
                                            .font(Theme.Fonts.labelSmall)
                                            .foregroundStyle(Theme.Colors.onSurfaceVariant)
                                    }
                                }
                            }

                            if let notes = session.notes, !notes.isEmpty {
                                Text(notes)
                                    .font(Theme.Fonts.bodySmall)
                                    .foregroundStyle(Theme.Colors.onSurfaceVariant)
                            }
                        }
                        .padding(16)
                        .cardStyle()

                        // Exercises
                        if let exercises = session.exercises, !exercises.isEmpty {
                            ForEach(exercises) { sessionExercise in
                                SessionExerciseCard(
                                    sessionExercise: sessionExercise,
                                    editingLogs: binding(for: sessionExercise),
                                    onLogsChanged: { logs in
                                        scheduleAutosave(sessionExerciseId: sessionExercise.id, logs: logs)
                                    }
                                )
                            }
                        } else {
                            EmptyStateView(
                                icon: "plus.circle",
                                title: "No exercises yet",
                                message: "Add exercises to start logging",
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
                    }
                    .padding(16)
                }
            }
        }
        .navigationTitle(viewModel.session?.title ?? "Session")
        .navigationBarTitleDisplayMode(.inline)
        .sheet(isPresented: $showAddExercise) {
            AddExerciseSheet { exerciseId in
                Task { await viewModel.addExercise(exerciseId: exerciseId) }
            }
        }
        .task { await viewModel.load() }
        .refreshable { await viewModel.load() }
    }

    private func binding(for sessionExercise: SessionExercise) -> Binding<[EditableSetLog]> {
        Binding(
            get: {
                if let existing = editingLogs[sessionExercise.id] {
                    return existing
                }
                let setLogs = sessionExercise.setLogs ?? []
                if setLogs.isEmpty {
                    return [EditableSetLog(setIndex: 0)]
                }
                return setLogs.map { log in
                    convertToEditable(log)
                }
            },
            set: { newValue in
                editingLogs[sessionExercise.id] = newValue
            }
        )
    }

    private func convertToEditable(_ log: SetLog) -> EditableSetLog {
        let repsStr: String = log.reps.map { String($0) } ?? ""
        let weightStr: String = log.weight.map { String(format: "%.1f", $0) } ?? ""
        let durStr: String = log.durationSec.map { String($0) } ?? ""
        let rpeStr: String = log.rpe.map { String($0) } ?? ""
        return EditableSetLog(
            setIndex: log.setIndex,
            reps: repsStr,
            weight: weightStr,
            unit: log.unit,
            durationSec: durStr,
            rpe: rpeStr,
            completed: log.completed
        )
    }

    private func scheduleAutosave(sessionExerciseId: String, logs: [EditableSetLog]) {
        let upserts = logs.compactMap { log -> SetLogUpsert? in
            // Only save logs that have some data
            let hasData = !log.reps.isEmpty || !log.weight.isEmpty || !log.durationSec.isEmpty
            guard hasData else { return nil }
            return SetLogUpsert(
                sessionExerciseId: sessionExerciseId,
                setIndex: log.setIndex,
                reps: Int(log.reps),
                weight: Double(log.weight),
                unit: log.unit.rawValue,
                durationSec: Int(log.durationSec),
                rpe: Int(log.rpe),
                completed: log.completed
            )
        }
        viewModel.scheduleAutosave(logs: upserts)
    }
}

// MARK: - Editable Set Log

struct EditableSetLog: Identifiable {
    let id = UUID()
    var setIndex: Int
    var reps: String = ""
    var weight: String = ""
    var unit: WeightUnit = .lb
    var durationSec: String = ""
    var rpe: String = ""
    var completed: Bool = true
}

// MARK: - Session Exercise Card

struct SessionExerciseCard: View {
    let sessionExercise: SessionExercise
    @Binding var editingLogs: [EditableSetLog]
    let onLogsChanged: ([EditableSetLog]) -> Void

    private var isStrength: Bool {
        sessionExercise.exercise?.category == .strength ||
        sessionExercise.exercise?.category == .plyometrics
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Exercise name
            HStack {
                if let exercise = sessionExercise.exercise {
                    Image(systemName: exercise.category.icon)
                        .foregroundStyle(exercise.category.accentColor)
                    Text(exercise.name)
                        .font(Theme.Fonts.titleSmall)
                        .foregroundStyle(Theme.Colors.onSurface)
                }
                Spacer()
            }

            // Set headers
            if isStrength {
                HStack(spacing: 8) {
                    Text("SET")
                        .frame(width: 32)
                    Text("REPS")
                        .frame(maxWidth: .infinity)
                    Text("WEIGHT")
                        .frame(maxWidth: .infinity)
                    Text("RPE")
                        .frame(width: 48)
                    Spacer().frame(width: 32)
                }
                .font(Theme.Fonts.labelSmall)
                .foregroundStyle(Theme.Colors.onSurfaceVariant)
            } else {
                HStack(spacing: 8) {
                    Text("SET")
                        .frame(width: 32)
                    Text("DURATION (s)")
                        .frame(maxWidth: .infinity)
                    Text("RPE")
                        .frame(width: 48)
                    Spacer().frame(width: 32)
                }
                .font(Theme.Fonts.labelSmall)
                .foregroundStyle(Theme.Colors.onSurfaceVariant)
            }

            // Set rows
            ForEach(editingLogs.indices, id: \.self) { index in
                SetLogRowView(
                    setLog: $editingLogs[index],
                    isStrength: isStrength,
                    onChanged: { onLogsChanged(editingLogs) },
                    onDelete: {
                        editingLogs.remove(at: index)
                        // Re-index
                        for i in editingLogs.indices {
                            editingLogs[i].setIndex = i
                        }
                        onLogsChanged(editingLogs)
                    }
                )
            }

            // Add set button
            Button {
                editingLogs.append(EditableSetLog(setIndex: editingLogs.count))
                onLogsChanged(editingLogs)
            } label: {
                HStack(spacing: 4) {
                    Image(systemName: "plus")
                    Text("Add Set")
                }
                .font(Theme.Fonts.labelMedium)
                .foregroundStyle(Theme.Colors.primary)
            }
        }
        .padding(16)
        .cardStyle()
    }
}
