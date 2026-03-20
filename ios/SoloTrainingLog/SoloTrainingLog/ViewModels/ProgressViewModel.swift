import SwiftUI

@MainActor
class ProgressViewModel: ObservableObject {
    @Published var dataPoints: [ProgressDataPoint] = []
    @Published var recentPRs: [ProgressDataPoint] = []
    @Published var isLoading = false
    @Published var errorMessage: String?
    @Published var selectedExercise: Exercise?

    func load(exerciseId: String) async {
        isLoading = true
        errorMessage = nil
        do {
            let response = try await ProgressService.getExerciseProgress(exerciseId: exerciseId)
            dataPoints = response.dataPoints
            recentPRs = response.recentPRs
        } catch let error as APIError {
            errorMessage = error.errorDescription
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }
}
