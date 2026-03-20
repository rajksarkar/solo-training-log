import SwiftUI

struct SessionListView: View {
    @StateObject private var viewModel = SessionListViewModel()
    @State private var showCreateSheet = false

    var body: some View {
        NavigationStack {
            ZStack {
                Theme.Colors.surface.ignoresSafeArea()

                if viewModel.isLoading && viewModel.sessions.isEmpty {
                    LoadingView()
                } else if viewModel.sessions.isEmpty {
                    EmptyStateView(
                        icon: "calendar.badge.plus",
                        title: "No sessions yet",
                        message: "Start logging your workouts",
                        action: { showCreateSheet = true },
                        actionLabel: "New Session"
                    )
                } else {
                    List {
                        ForEach(viewModel.sessions) { session in
                            NavigationLink(destination: SessionDetailView(sessionId: session.id)) {
                                SessionRowView(session: session)
                            }
                            .listRowBackground(Theme.Colors.surface)
                            .listRowSeparatorTint(Theme.Colors.outlineVariant.opacity(0.5))
                        }
                        .onDelete { indexSet in
                            for index in indexSet {
                                let session = viewModel.sessions[index]
                                Task { await viewModel.deleteSession(id: session.id) }
                            }
                        }
                    }
                    .listStyle(.plain)
                }
            }
            .navigationTitle("Sessions")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        showCreateSheet = true
                    } label: {
                        Image(systemName: "plus")
                            .foregroundStyle(Theme.Colors.primary)
                    }
                }
            }
            .sheet(isPresented: $showCreateSheet) {
                CreateSessionView {
                    Task { await viewModel.load() }
                }
            }
            .task { await viewModel.load() }
            .refreshable { await viewModel.load() }
        }
    }
}

// MARK: - Create Session View

struct CreateSessionView: View {
    @Environment(\.dismiss) var dismiss
    @State private var title = ""
    @State private var category: ExerciseCategory = .strength
    @State private var date = Date()
    @State private var notes = ""
    @State private var selectedTemplate: SessionTemplate?
    @State private var templates: [SessionTemplate] = []
    @State private var isLoading = false
    @State private var errorMessage: String?

    var onCreated: () -> Void

    private let dateFormatter: DateFormatter = {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        return f
    }()

    var body: some View {
        NavigationStack {
            ZStack {
                Theme.Colors.surface.ignoresSafeArea()

                Form {
                    Section {
                        TextField("Session title", text: $title)
                        Picker("Category", selection: $category) {
                            ForEach(ExerciseCategory.allCases) { cat in
                                Text(cat.displayName).tag(cat)
                            }
                        }
                        DatePicker("Date", selection: $date, displayedComponents: .date)
                    }

                    if !templates.isEmpty {
                        Section("From Template (optional)") {
                            Picker("Template", selection: $selectedTemplate) {
                                Text("None").tag(nil as SessionTemplate?)
                                ForEach(templates) { template in
                                    Text(template.title).tag(template as SessionTemplate?)
                                }
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
            .navigationTitle("New Session")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                        .foregroundStyle(Theme.Colors.primary)
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button {
                        Task { await createSession() }
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
            .task {
                do { templates = try await TemplateService.list() } catch {}
            }
        }
    }

    private func createSession() async {
        isLoading = true
        errorMessage = nil
        do {
            let _ = try await SessionService.create(
                CreateSessionRequest(
                    title: title,
                    category: category.rawValue,
                    date: dateFormatter.string(from: date),
                    notes: notes.isEmpty ? nil : notes,
                    templateId: selectedTemplate?.id
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
