import SwiftUI

@MainActor
class TemplateListViewModel: ObservableObject {
    @Published var templates: [SessionTemplate] = []
    @Published var isLoading = false
    @Published var errorMessage: String?

    func load() async {
        isLoading = true
        errorMessage = nil
        do {
            templates = try await TemplateService.list()
        } catch let error as APIError {
            errorMessage = error.errorDescription
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }

    func deleteTemplate(id: String) async {
        do {
            try await TemplateService.delete(id: id)
            templates.removeAll { $0.id == id }
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}
