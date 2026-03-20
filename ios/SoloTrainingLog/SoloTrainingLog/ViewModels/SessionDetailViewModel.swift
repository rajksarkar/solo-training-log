import SwiftUI
import Combine

@MainActor
class SessionDetailViewModel: ObservableObject {
    @Published var session: Session?
    @Published var isLoading = false
    @Published var errorMessage: String?
    @Published var isSaving = false

    private var saveTask: Task<Void, Never>?
    let sessionId: String

    init(sessionId: String) {
        self.sessionId = sessionId
    }

    func load() async {
        isLoading = true
        errorMessage = nil
        do {
            session = try await SessionService.get(id: sessionId)
        } catch let error as APIError {
            errorMessage = error.errorDescription
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }

    func addExercise(exerciseId: String) async {
        let currentOrder = session?.exercises?.count ?? 0
        do {
            let _ = try await SessionService.addExercise(
                sessionId: sessionId,
                request: AddSessionExerciseRequest(exerciseId: exerciseId, order: currentOrder)
            )
            await load() // Reload to get full exercise data
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    // Debounced autosave for set logs
    func scheduleAutosave(logs: [SetLogUpsert]) {
        saveTask?.cancel()
        saveTask = Task {
            try? await Task.sleep(for: .seconds(1.5))
            guard !Task.isCancelled else { return }
            await saveLogs(logs)
        }
    }

    func saveLogs(_ logs: [SetLogUpsert]) async {
        guard !logs.isEmpty else { return }
        isSaving = true
        do {
            let _ = try await SessionService.bulkUpsertLogs(sessionId: sessionId, logs: logs)
        } catch {
            errorMessage = error.localizedDescription
        }
        isSaving = false
    }
}
