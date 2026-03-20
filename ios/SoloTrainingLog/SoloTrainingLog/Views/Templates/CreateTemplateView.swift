import SwiftUI

struct CreateTemplateView: View {
    @Environment(\.dismiss) var dismiss
    @State private var title = ""
    @State private var category: ExerciseCategory = .strength
    @State private var notes = ""
    @State private var isLoading = false
    @State private var errorMessage: String?

    var onCreated: () -> Void

    var body: some View {
        NavigationStack {
            ZStack {
                Theme.Colors.surface.ignoresSafeArea()

                Form {
                    Section {
                        TextField("Template title", text: $title)
                        Picker("Category", selection: $category) {
                            ForEach(ExerciseCategory.allCases) { cat in
                                Text(cat.displayName).tag(cat)
                            }
                        }
                    }

                    Section("Notes (optional)") {
                        TextEditor(text: $notes)
                            .frame(minHeight: 60)
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
            .navigationTitle("New Template")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                        .foregroundStyle(Theme.Colors.primary)
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button {
                        Task { await createTemplate() }
                    } label: {
                        if isLoading {
                            ProgressView()
                        } else {
                            Text("Create")
                        }
                    }
                    .disabled(title.isEmpty || isLoading)
                    .foregroundStyle(Theme.Colors.primary)
                }
            }
        }
    }

    private func createTemplate() async {
        isLoading = true
        errorMessage = nil
        do {
            let _ = try await TemplateService.create(
                CreateTemplateRequest(
                    title: title,
                    category: category.rawValue,
                    notes: notes.isEmpty ? nil : notes
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
