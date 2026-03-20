import SwiftUI

struct DashboardView: View {
    @EnvironmentObject var authViewModel: AuthViewModel
    @StateObject private var viewModel = DashboardViewModel()

    var body: some View {
        NavigationStack {
            ZStack {
                Theme.Colors.surface.ignoresSafeArea()

                ScrollView {
                    VStack(spacing: 20) {
                        // Welcome
                        VStack(alignment: .leading, spacing: 4) {
                            Text("Welcome back,")
                                .font(Theme.Fonts.bodyMedium)
                                .foregroundStyle(Theme.Colors.onSurfaceVariant)
                            Text(authViewModel.currentUser?.name ?? "Athlete")
                                .font(Theme.Fonts.displayMedium)
                                .foregroundStyle(Theme.Colors.onSurface)
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)

                        // Stats
                        HStack(spacing: 12) {
                            StatCard(
                                title: "This Week",
                                value: "\(viewModel.weekSessionCount)",
                                icon: "flame.fill"
                            )
                            StatCard(
                                title: "Total",
                                value: "\(viewModel.totalSessionCount)",
                                icon: "chart.bar.fill"
                            )
                        }

                        // Recent sessions
                        if !viewModel.recentSessions.isEmpty {
                            VStack(alignment: .leading, spacing: 12) {
                                Text("Recent Sessions")
                                    .font(Theme.Fonts.titleMedium)
                                    .foregroundStyle(Theme.Colors.onSurface)

                                ForEach(viewModel.recentSessions) { session in
                                    NavigationLink(destination: SessionDetailView(sessionId: session.id)) {
                                        SessionRowView(session: session)
                                    }
                                    .buttonStyle(.plain)
                                }
                            }
                        }
                    }
                    .padding(20)
                }
            }
            .navigationTitle("Dashboard")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Menu {
                        Button(role: .destructive) {
                            authViewModel.logout()
                        } label: {
                            Label("Sign Out", systemImage: "rectangle.portrait.and.arrow.right")
                        }
                    } label: {
                        Image(systemName: "person.circle")
                            .foregroundStyle(Theme.Colors.primary)
                    }
                }
            }
            .task { await viewModel.load() }
            .refreshable { await viewModel.load() }
        }
    }
}

struct StatCard: View {
    let title: String
    let value: String
    let icon: String

    var body: some View {
        VStack(spacing: 8) {
            HStack {
                Image(systemName: icon)
                    .foregroundStyle(Theme.Colors.primary)
                Spacer()
            }
            HStack {
                Text(value)
                    .font(.system(size: 32, weight: .bold, design: .rounded))
                    .foregroundStyle(Theme.Colors.onSurface)
                Spacer()
            }
            HStack {
                Text(title)
                    .font(Theme.Fonts.labelMedium)
                    .foregroundStyle(Theme.Colors.onSurfaceVariant)
                Spacer()
            }
        }
        .padding(16)
        .cardStyle()
    }
}
