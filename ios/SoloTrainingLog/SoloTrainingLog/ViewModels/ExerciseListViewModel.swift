import SwiftUI

@MainActor
class ExerciseListViewModel: ObservableObject {
    @Published var exercises: [Exercise] = []
    @Published var isLoading = false
    @Published var searchText = ""
    @Published var selectedCategory: ExerciseCategory?
    @Published var errorMessage: String?

    func load() async {
        isLoading = true
        errorMessage = nil
        do {
            exercises = try await ExerciseService.list(
                query: searchText.isEmpty ? nil : searchText,
                category: selectedCategory
            )
        } catch let error as APIError {
            if case .unauthorized = error {
                // Handle logout
            }
            errorMessage = error.errorDescription
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }

    func search() async {
        await load()
    }

    func filterByCategory(_ category: ExerciseCategory?) async {
        selectedCategory = category
        await load()
    }
}
