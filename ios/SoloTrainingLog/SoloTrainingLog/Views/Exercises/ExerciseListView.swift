import SwiftUI

struct ExerciseListView: View {
    @StateObject private var viewModel = ExerciseListViewModel()
    @State private var showCreateSheet = false
    @State private var selectedExercise: Exercise?

    var body: some View {
        NavigationStack {
            ZStack {
                Theme.Colors.surface.ignoresSafeArea()

                VStack(spacing: 0) {
                    // Category filter chips
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 8) {
                            FilterChip(
                                title: "All",
                                isSelected: viewModel.selectedCategory == nil
                            ) {
                                Task { await viewModel.filterByCategory(nil) }
                            }
                            ForEach(ExerciseCategory.allCases) { category in
                                FilterChip(
                                    title: category.displayName,
                                    isSelected: viewModel.selectedCategory == category
                                ) {
                                    Task { await viewModel.filterByCategory(category) }
                                }
                            }
                        }
                        .padding(.horizontal, 16)
                        .padding(.vertical, 8)
                    }

                    if viewModel.isLoading && viewModel.exercises.isEmpty {
                        LoadingView()
                    } else if viewModel.exercises.isEmpty {
                        EmptyStateView(
                            icon: "dumbbell",
                            title: "No exercises found",
                            message: "Try a different search or category"
                        )
                    } else {
                        List(viewModel.exercises) { exercise in
                            Button {
                                selectedExercise = exercise
                            } label: {
                                ExerciseRowView(exercise: exercise)
                            }
                            .listRowBackground(Theme.Colors.surface)
                            .listRowSeparatorTint(Theme.Colors.outlineVariant.opacity(0.5))
                        }
                        .listStyle(.plain)
                    }
                }
            }
            .navigationTitle("Exercises")
            .navigationBarTitleDisplayMode(.large)
            .searchable(text: $viewModel.searchText, prompt: "Search exercises...")
            .onSubmit(of: .search) {
                Task { await viewModel.search() }
            }
            .onChange(of: viewModel.searchText) {
                if viewModel.searchText.isEmpty {
                    Task { await viewModel.load() }
                }
            }
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
            .sheet(item: $selectedExercise) { exercise in
                ExerciseDetailSheet(exercise: exercise)
            }
            .sheet(isPresented: $showCreateSheet) {
                CreateExerciseView {
                    Task { await viewModel.load() }
                }
            }
            .task { await viewModel.load() }
            .refreshable { await viewModel.load() }
        }
    }
}

// MARK: - Filter Chip

struct FilterChip: View {
    let title: String
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(title)
                .font(Theme.Fonts.labelMedium)
                .padding(.horizontal, 14)
                .padding(.vertical, 8)
                .background(isSelected ? Theme.Colors.primary : Theme.Colors.surfaceContainerLowest)
                .foregroundStyle(isSelected ? Theme.Colors.onPrimary : Theme.Colors.onSurfaceVariant)
                .clipShape(Capsule())
                .overlay(
                    Capsule()
                        .stroke(isSelected ? Color.clear : Theme.Colors.outlineVariant.opacity(0.5), lineWidth: 1)
                )
        }
    }
}
