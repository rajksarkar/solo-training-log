import SwiftUI

struct AddExerciseSheet: View {
    @Environment(\.dismiss) var dismiss
    @StateObject private var viewModel = ExerciseListViewModel()
    let onSelect: (String) -> Void

    var body: some View {
        NavigationStack {
            ZStack {
                Theme.Colors.surface.ignoresSafeArea()

                VStack(spacing: 0) {
                    // Category filter
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 8) {
                            FilterChip(title: "All", isSelected: viewModel.selectedCategory == nil) {
                                Task { await viewModel.filterByCategory(nil) }
                            }
                            ForEach(ExerciseCategory.allCases) { category in
                                FilterChip(title: category.displayName, isSelected: viewModel.selectedCategory == category) {
                                    Task { await viewModel.filterByCategory(category) }
                                }
                            }
                        }
                        .padding(.horizontal, 16)
                        .padding(.vertical, 8)
                    }

                    if viewModel.isLoading && viewModel.exercises.isEmpty {
                        LoadingView()
                    } else {
                        List(viewModel.exercises) { exercise in
                            Button {
                                onSelect(exercise.id)
                                dismiss()
                            } label: {
                                ExerciseRowView(exercise: exercise)
                            }
                            .listRowBackground(Theme.Colors.surface)
                        }
                        .listStyle(.plain)
                    }
                }
            }
            .navigationTitle("Add Exercise")
            .navigationBarTitleDisplayMode(.inline)
            .searchable(text: $viewModel.searchText, prompt: "Search exercises...")
            .onSubmit(of: .search) {
                Task { await viewModel.search() }
            }
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                        .foregroundStyle(Theme.Colors.primary)
                }
            }
            .task { await viewModel.load() }
        }
    }
}
