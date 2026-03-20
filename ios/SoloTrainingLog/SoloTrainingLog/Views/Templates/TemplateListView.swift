import SwiftUI

struct TemplateListView: View {
    @StateObject private var viewModel = TemplateListViewModel()
    @State private var showCreateSheet = false

    var body: some View {
        NavigationStack {
            ZStack {
                Theme.Colors.surface.ignoresSafeArea()

                if viewModel.isLoading && viewModel.templates.isEmpty {
                    LoadingView()
                } else if viewModel.templates.isEmpty {
                    EmptyStateView(
                        icon: "doc.text",
                        title: "No templates yet",
                        message: "Create workout templates for quick session creation",
                        action: { showCreateSheet = true },
                        actionLabel: "New Template"
                    )
                } else {
                    List {
                        ForEach(viewModel.templates) { template in
                            NavigationLink(destination: TemplateDetailView(templateId: template.id)) {
                                HStack(spacing: 12) {
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text(template.title)
                                            .font(Theme.Fonts.titleSmall)
                                            .foregroundStyle(Theme.Colors.onSurface)
                                        HStack(spacing: 8) {
                                            CategoryBadge(category: template.category)
                                            if let exercises = template.exercises {
                                                Text("\(exercises.count) exercises")
                                                    .font(Theme.Fonts.labelSmall)
                                                    .foregroundStyle(Theme.Colors.onSurfaceVariant)
                                            }
                                        }
                                    }
                                    Spacer()
                                }
                            }
                            .listRowBackground(Theme.Colors.surface)
                            .listRowSeparatorTint(Theme.Colors.outlineVariant.opacity(0.5))
                        }
                        .onDelete { indexSet in
                            for index in indexSet {
                                let template = viewModel.templates[index]
                                Task { await viewModel.deleteTemplate(id: template.id) }
                            }
                        }
                    }
                    .listStyle(.plain)
                }
            }
            .navigationTitle("Templates")
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
                CreateTemplateView {
                    Task { await viewModel.load() }
                }
            }
            .task { await viewModel.load() }
            .refreshable { await viewModel.load() }
        }
    }
}
