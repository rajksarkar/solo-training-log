import SwiftUI

struct CreateExerciseView: View {
    @Environment(\.dismiss) var dismiss
    @State private var name = ""
    @State private var category: ExerciseCategory = .strength
    @State private var instructions = ""
    @State private var isLoading = false
    @State private var errorMessage: String?

    var onCreated: () -> Void

    var body: some View {
        NavigationStack {
            ZStack {
                Theme.Colors.surface.ignoresSafeArea()

                Form {
                    Section {
                        TextField("Exercise name", text: $name)
                        Picker("Category", selection: $category) {
                            ForEach(ExerciseCategory.allCases) { cat in
                                Text(cat.displayName).tag(cat)
                            }
                        }
                    }

                    Section("Instructions (optional)") {
                        TextEditor(text: $instructions)
                            .frame(minHeight: 80)
                    }

                    if let error = errorMessage {
                        Section {
                            Text(error)
                                .foregroundStyle(Theme.Colors.error)
                                .font(Theme.Fonts.bodySmall)
                        }
                    }
                }
                .scrollContentBackground(.hidden)
            }
            .navigationTitle("New Exercise")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                        .foregroundStyle(Theme.Colors.primary)
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button {
                        Task { await createExercise() }
                    } label: {
                        if isLoading {
                            ProgressView()
                        } else {
                            Text("Create")
                        }
                    }
                    .disabled(name.isEmpty || isLoading)
                    .foregroundStyle(Theme.Colors.primary)
                }
            }
        }
    }

    private func createExercise() async {
        isLoading = true
        errorMessage = nil
        do {
            let _ = try await ExerciseService.create(
                CreateExerciseRequest(
                    name: name,
                    category: category.rawValue,
                    instructions: instructions.isEmpty ? nil : instructions
                )
            )
            onCreated()
            dismiss()
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }
}
