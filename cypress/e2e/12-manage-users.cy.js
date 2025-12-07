describe('User Management Page', () => {
    beforeEach(() => {
        // Mock API users
        const mockUsers = [
            {
                _id: 'user-123',
                name: 'Nguyễn Văn A',
                username: 'nguyenvana',
                email: 'nguyenvana@email.com',
                phone: '0912345678',
                vipStatus: true,
                createdAt: '2024-12-01T10:00:00.000Z'
            },
            {
                _id: 'user-124',
                name: 'Trần Thị B',
                username: 'tranthib',
                email: 'tranthib@email.com',
                phone: '0923456789',
                vipStatus: false,
                createdAt: '2024-12-02T14:30:00.000Z'
            }
        ];

        // Mock GET /users
        cy.intercept('GET', '**/api/users', {
            statusCode: 200,
            body: mockUsers
        }).as('getUsers');

        // Mock DELETE /users/:id
        cy.intercept('DELETE', '**/api/users/*', {
            statusCode: 200,
            body: { success: true, message: 'User deleted' }
        }).as('deleteUser');

        // Mock PUT /users/update-vip
        cy.intercept('PUT', '**/api/users/update-vip', {
            statusCode: 200,
            body: { success: true, message: 'VIP status updated' }
        }).as('updateVipStatus');

        // Visit page as admin
        cy.visit('/admin/users', {
            onBeforeLoad(win) {
                win.localStorage.setItem('isAdmin', 'true');
                win.localStorage.setItem('userInfo', JSON.stringify({
                    username: 'admin',
                    role: 'admin'
                }));
            }
        });

        cy.wait('@getUsers', { timeout: 10000 });
    });

    it('should load and display users page', () => {
        // Check page title
        cy.contains('h1', 'Quản lý Người dùng').should('be.visible');

        // Check back button
        cy.contains('button', '← Quay lại').should('be.visible');

        // Check table
        cy.get('.users-table').should('exist');
        cy.get('.users-table thead tr th').should('have.length', 6);

        // Check table headers
        cy.contains('th', 'Tên').should('be.visible');
        cy.contains('th', 'Email').should('be.visible');
        cy.contains('th', 'Số điện thoại').should('be.visible');
        cy.contains('th', 'VIP Status').should('be.visible');
        cy.contains('th', 'Ngày tạo').should('be.visible');
        cy.contains('th', 'Hành động').should('be.visible');
    });

    it('should display users data in table', () => {
        cy.get('.users-table tbody tr').should('have.length.at.least', 1);

        // Check first user data
        cy.get('.users-table tbody tr').first().within(() => {
            // Check name
            cy.get('td').eq(0).should('contain', 'Nguyễn');

            // Check email
            cy.get('td').eq(1).should('contain', '@');

            // Check phone
            cy.get('td').eq(2).should('contain', '09');

            // Check VIP status
            cy.get('.vip-status').should('exist');

            // Check date
            cy.get('td').eq(4).should('contain', '/'); // Date format

            // Check action buttons
            cy.get('.action-buttons').within(() => {
                cy.get('button').should('have.length.at.least', 1);
            });
        });
    });

    it('should cancel user deletion', () => {
        // Mock confirm dialog to return false (cancel)
        cy.on('window:confirm', () => false);

        cy.get('.users-table tbody tr').first().within(() => {
            cy.contains('button', 'Xóa').click();
        });

        // Should not call delete API
        cy.get('@deleteUser.all').should('have.length', 0);
    });

    it('should upgrade user to VIP', () => {
        // Find a non-VIP user
        cy.get('.users-table tbody tr').each(($row) => {
            cy.wrap($row).within(() => {
                cy.get('.vip-status').then(($status) => {
                    if ($status.text().includes('Thường')) {
                        // Mock confirm dialog
                        cy.on('window:confirm', (text) => {
                            expect(text).to.include('nâng cấp VIP');
                            return true;
                        });

                        // Click upgrade button
                        cy.contains('button', 'Nâng cấp VIP').click();

                        // Wait for API call
                        cy.wait('@updateVipStatus').then((interception) => {
                            expect(interception.request.method).to.equal('PUT');
                            expect(interception.request.body.vipStatus).to.equal(true);
                        });

                        return false; // Break loop
                    }
                });
            });
        });
    });

    it('should downgrade VIP user', () => {
        // Find a VIP user
        cy.get('.users-table tbody tr').each(($row) => {
            cy.wrap($row).within(() => {
                cy.get('.vip-status').then(($status) => {
                    if ($status.text().includes('VIP')) {
                        // Mock confirm dialog
                        cy.on('window:confirm', (text) => {
                            expect(text).to.include('hủy VIP');
                            return true;
                        });

                        // Click downgrade button (should be "Hủy VIP")
                        cy.contains('button', 'Hủy VIP').click();

                        // Wait for API call
                        cy.wait('@updateVipStatus');

                        return false; // Break loop
                    }
                });
            });
        });
    });

    it('should display user statistics', () => {
        cy.get('.user-stats').should('exist');
        cy.get('.stat-card').should('have.length', 3);

        // Check total users
        cy.contains('Tổng số người dùng').should('be.visible');
        cy.get('.user-stats').contains(/\d+/).should('be.visible');

        // Check VIP users
        cy.contains('VIP Users').should('be.visible');

        // Check regular users
        cy.contains('Users Thường').should('be.visible');
    });

    it('should navigate back', () => {
        cy.contains('button', '← Quay lại').click();

        // Check if navigated back
        cy.url().should('not.include', '/admin/users');
    });

    it('should handle empty users list', () => {
        // Mock empty response
        cy.intercept('GET', '**/api/users', {
            statusCode: 200,
            body: []
        }).as('getEmptyUsers');

        // Refresh page
        cy.reload();
        cy.wait('@getEmptyUsers');

        // Should show "Không có dữ liệu users"
        cy.contains('Không có dữ liệu users').should('be.visible');

        // Stats should show 0
        cy.contains('Tổng số người dùng').parent().within(() => {
            cy.contains('0').should('be.visible');
        });
    });

    it('should handle API errors', () => {
        // Mock API error
        cy.intercept('GET', '**/api/users', {
            statusCode: 500,
            body: { error: 'Server error' }
        }).as('getUsersError');

        // Refresh page
        cy.reload();
        cy.wait('@getUsersError');

        // Should show alert
        cy.on('window:alert', (alertText) => {
            expect(alertText).to.include('Không thể tải danh sách users');
        });
    });
});

describe('User Management - Loading State', () => {
    it('should show loading state', () => {
        // Mock API with delay
        cy.intercept('GET', '**/api/users', {
            delay: 2000,
            body: []
        }).as('getUsersDelayed');

        cy.visit('/admin/users', {
            onBeforeLoad(win) {
                win.localStorage.setItem('isAdmin', 'true');
            }
        });

        // Should show loading
        cy.contains('Đang tải...').should('be.visible');
        cy.get('.loading').should('be.visible');

        // Wait for loading to complete
        cy.wait('@getUsersDelayed');
        cy.get('.loading').should('not.exist');
    });
});