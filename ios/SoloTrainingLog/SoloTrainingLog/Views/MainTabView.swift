import SwiftUI

struct MainTabView: View {
    @EnvironmentObject var authViewModel: AuthViewModel

    var body: some View {
        TabView {
            DashboardView()
                .tabItem {
                    Label("Dashboard", systemImage: "house.fill")
                }

            ExerciseListView()
                .tabItem {
                    Label("Exercises", systemImage: "dumbbell.fill")
                }

            TemplateListView()
                .tabItem {
                    Label("Templates", systemImage: "doc.text.fill")
                }

            SessionListView()
                .tabItem {
                    Label("Sessions", systemImage: "calendar")
                }
        }
        .tint(Theme.Colors.primary)
    }
}
