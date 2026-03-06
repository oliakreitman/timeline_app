"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  getAllUsersWithSubmissions,
  searchUsers,
  updateUserRole,
  UserWithSubmission,
  UserRole,
} from "@/lib/database";
import { logOut } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function AdminDashboard() {
  const { user, isAdmin, loading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<UserWithSubmission[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserWithSubmission[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
      return;
    }

    if (!loading && user && !isAdmin) {
      router.push("/");
      return;
    }

    if (!loading && isAdmin) {
      loadUsers();
    }
  }, [user, isAdmin, loading, router]);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const allUsers = await getAllUsersWithSubmissions();
      setUsers(allUsers);
      setFilteredUsers(allUsers);
    } catch (err: any) {
      setError(err.message || "Failed to load users");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (term: string) => {
    setSearchTerm(term);
    
    if (!term.trim()) {
      applyFilters(users, statusFilter);
      return;
    }

    try {
      const results = await searchUsers(term);
      applyFilters(results, statusFilter);
    } catch (err: any) {
      setError(err.message || "Search failed");
    }
  };

  const applyFilters = (userList: UserWithSubmission[], status: string) => {
    let filtered = userList;

    if (status !== "all") {
      if (status === "no-submission") {
        filtered = userList.filter((u) => !u.hasSubmission);
      } else {
        filtered = userList.filter(
          (u) => u.hasSubmission && u.submissionStatus === status
        );
      }
    }

    setFilteredUsers(filtered);
  };

  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(status);
    const baseList = searchTerm.trim() 
      ? users.filter(u => 
          u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          u.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          u.lastName.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : users;
    applyFilters(baseList, status);
  };

  const handleToggleAdmin = async (userId: string, currentRole: UserRole) => {
    try {
      const newRole: UserRole = currentRole === "admin" ? "user" : "admin";
      await updateUserRole(userId, newRole);
      await loadUsers();
    } catch (err: any) {
      setError(err.message || "Failed to update role");
    }
  };

  const handleLogout = async () => {
    try {
      await logOut();
      router.push("/");
    } catch (err: any) {
      setError(err.message || "Failed to log out");
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusBadgeClass = (status?: string) => {
    switch (status) {
      case "submitted":
        return "bg-blue-100 text-blue-800";
      case "reviewed":
        return "bg-green-100 text-green-800";
      case "draft":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-sm text-gray-500">
                Manage users and intake submissions
              </p>
            </div>
            <div className="flex items-center gap-4">
              <a href="/" className="text-sm text-blue-600 hover:underline">
                ← Back to App
              </a>
              <span className="text-sm text-gray-600">
                {user?.email}
              </span>
              <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded">
                Admin
              </span>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
            <button
              className="text-red-600 underline text-sm mt-1"
              onClick={() => setError(null)}
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Users</CardDescription>
              <CardTitle className="text-3xl">{users.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Submissions</CardDescription>
              <CardTitle className="text-3xl">
                {users.filter((u) => u.hasSubmission).length}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Pending Review</CardDescription>
              <CardTitle className="text-3xl">
                {users.filter((u) => u.submissionStatus === "submitted").length}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Reviewed</CardDescription>
              <CardTitle className="text-3xl">
                {users.filter((u) => u.submissionStatus === "reviewed").length}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Users</CardTitle>
            <CardDescription>
              View and manage all user accounts and their submissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full"
                />
              </div>
              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => handleStatusFilterChange(e.target.value)}
                  className="h-9 w-full sm:w-48 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                >
                  <option value="all">All Status</option>
                  <option value="no-submission">No Submission</option>
                  <option value="draft">Draft</option>
                  <option value="submitted">Submitted</option>
                  <option value="reviewed">Reviewed</option>
                </select>
              </div>
              <Button variant="outline" onClick={loadUsers}>
                Refresh
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-3 font-medium text-gray-600">User</th>
                    <th className="pb-3 font-medium text-gray-600">Email</th>
                    <th className="pb-3 font-medium text-gray-600">Role</th>
                    <th className="pb-3 font-medium text-gray-600">Submission</th>
                    <th className="pb-3 font-medium text-gray-600">Created</th>
                    <th className="pb-3 font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-gray-500">
                        No users found
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((userItem) => (
                      <tr key={userItem.id} className="border-b hover:bg-gray-50">
                        <td className="py-4">
                          <div className="font-medium text-gray-900">
                            {userItem.firstName} {userItem.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {userItem.id.slice(0, 8)}...
                          </div>
                        </td>
                        <td className="py-4 text-gray-600">{userItem.email}</td>
                        <td className="py-4">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded ${
                              userItem.role === "admin"
                                ? "bg-purple-100 text-purple-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {userItem.role}
                          </span>
                        </td>
                        <td className="py-4">
                          {userItem.hasSubmission ? (
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded ${getStatusBadgeClass(
                                userItem.submissionStatus
                              )}`}
                            >
                              {userItem.submissionStatus}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-sm">
                              No submission
                            </span>
                          )}
                        </td>
                        <td className="py-4 text-gray-600 text-sm">
                          {formatDate(userItem.createdAt)}
                        </td>
                        <td className="py-4">
                          <div className="flex gap-2">
                            {userItem.hasSubmission && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  router.push(`/admin/user/${userItem.id}`)
                                }
                              >
                                View
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleToggleAdmin(userItem.id, userItem.role)
                              }
                              disabled={userItem.id === user?.uid}
                              title={
                                userItem.id === user?.uid
                                  ? "Cannot change your own role"
                                  : ""
                              }
                            >
                              {userItem.role === "admin"
                                ? "Remove Admin"
                                : "Make Admin"}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
