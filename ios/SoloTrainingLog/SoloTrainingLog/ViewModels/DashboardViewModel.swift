import SwiftUI

@MainActor
class DashboardViewModel: ObservableObject {
    @Published var recentSessions: [Session] = []
    @Published var weekSessionCount = 0
    @Published var totalSessionCount = 0
    @Published var isLoading = false
    @Published var errorMessage: String?

    func load() async {
        isLoading = true
        errorMessage = nil
        do {
            let allSessions = try await SessionService.list()
            totalSessionCount = allSessions.count
            recentSessions = Array(allSessions.prefix(5))

            // Count sessions this week
            let calendar = Calendar.current
            let startOfWeek = calendar.dateInterval(of: .weekOfYear, for: Date())?.start ?? Date()
            let dateFormatter = ISO8601DateFormatter()
            dateFormatter.formatOptions = [.withFullDate, .withDashSeparatorInDate]
            weekSessionCount = allSessions.filter { session in
                if let date = dateFormatter.date(from: String(session.date.prefix(10))) {
                    return date >= startOfWeek
                }
                return false
            }.count
        } catch let error as APIError {
            errorMessage = error.errorDescription
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }
}
