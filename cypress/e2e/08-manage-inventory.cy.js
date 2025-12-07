describe('Manage Inventory Page', () => {
    beforeEach(() => {
        // 1. Mock API products
        cy.fixture('inventory-data.json').then((inventoryData) => {
            cy.intercept('GET', '**/api/products', {
                statusCode: 200,
                body: inventoryData
            }).as('getProducts');
        });

        // 2. Mock admin login API để bypass authentication
        cy.intercept('POST', '**/api/admin/login', {
            statusCode: 200,
            body: {
                success: true,
                token: 'mock-admin-token-12345',
                user: { username: 'admin', role: 'admin' }
            }
        }).as('adminLogin');

        // 3. Đặt trạng thái admin trực tiếp trong localStorage
        cy.visit('/admin/inventory', {
            onBeforeLoad(win) {
                // Đặt admin flag
                win.localStorage.setItem('isAdmin', 'true');
                win.localStorage.setItem('userInfo', JSON.stringify({
                    username: 'admin',
                    role: 'admin'
                }));
            }
        });

        // 4. Chờ API load
        cy.wait('@getProducts', { timeout: 10000 });
    });

    it('should load and display inventory data correctly', () => {
        cy.contains('h2', 'Manage Inventory').should('be.visible');
        cy.get('input[placeholder*="Search"]').should('be.visible');
        cy.get('select').should('have.length', 2);
        cy.get('.admin-table').should('exist');
        cy.get('.admin-table thead tr th').should('have.length', 7);
        cy.get('.admin-table tbody tr').should('have.length.at.least', 1);

        cy.get('.admin-table tbody tr').first().within(() => {
            cy.get('td').eq(2).should('contain', 'Nike Air Force 1');
            cy.get('td').eq(3).should('contain', 'Men');
            cy.get('td').eq(4).should('contain', '50');
        });
    });

    it('should filter products by search input', () => {
        cy.get('input[placeholder*="Search"]').type('Nike');
        cy.get('.admin-table tbody tr').should('have.length', 1);
        cy.get('.admin-table tbody tr').first().should('contain', 'Nike Air Force 1');

        cy.get('input[placeholder*="Search"]').clear().type('air');
        cy.get('.admin-table tbody tr').should('have.length', 1);
        cy.get('.admin-table tbody tr').first().should('contain', 'Air');

        cy.get('input[placeholder*="Search"]').clear();
        cy.get('.admin-table tbody tr').should('have.length.gte', 1);
    });

    it('should filter products by status', () => {
        cy.get('select').first().select('In Stock');
        cy.get('.admin-table tbody tr').each(($row) => {
            cy.wrap($row).find('td').eq(6).should('contain', 'In Stock');
        });

        cy.get('select').first().select('Running Low');
        cy.get('.admin-table tbody tr').each(($row) => {
            cy.wrap($row).find('td').eq(6).should('contain', 'Running Low');
        });

        cy.get('select').first().select('Sold Out');
        cy.get('.admin-table tbody tr').each(($row) => {
            cy.wrap($row).find('td').eq(6).should('contain', 'Sold Out');
        });

        cy.get('select').first().select('All');
    });

    it('should filter products by category', () => {
        cy.get('select').eq(1).select('Men');
        cy.get('.admin-table tbody tr').each(($row) => {
            cy.wrap($row).find('td').eq(3).should('contain', 'Men');
        });

        cy.get('select').eq(1).select('All');
    });

    it('should display correct inventory summary', () => {
        cy.fixture('inventory-data.json').then((data) => {
            const totalProducts = data.products.length;
            const soldOutCount = data.products.filter(p => p.stock === 0).length;
            const runningLowCount = data.products.filter(p => p.stock > 0 && p.stock <= 10).length;

            cy.get('.inventory-summary').within(() => {
                cy.contains(`Total Products: ${totalProducts}`);
                cy.contains(`Sold Out: ${soldOutCount}`);
                cy.contains(`Running Low: ${runningLowCount}`);
            });
        });
    });

    it('should handle pagination correctly', () => {
        cy.get('.pagination').should('be.visible');
        cy.get('.pagination button').should('have.length', 2);
        cy.get('.pagination span').should('contain', '1 /');

        cy.get('.pagination button').first().should('contain', 'Prev');
        cy.get('.pagination button').last().should('contain', 'Next');

        cy.get('.pagination button').first().should('be.disabled');
    });

    it('should navigate back when clicking back button', () => {
        cy.get('.back-home').should('contain', 'Back');

        cy.window().then((win) => {
            cy.stub(win.history, 'back').as('historyBack');
        });

        cy.get('.back-home').click();
        cy.get('@historyBack').should('be.calledOnce');
    });

    it('should display images correctly', () => {
        cy.get('.admin-table tbody tr').first().within(() => {
            cy.get('td').first().then(($td) => {
                const hasImg = $td.find('img').length > 0;
                if (hasImg) {
                    cy.get('img').should('be.visible');
                    cy.get('img').should('have.attr', 'src').and('include', 'http://localhost:5000');
                } else {
                    cy.get('td').first().should('contain', 'No Image');
                }
            });
        });
    });

    it('should update status colors correctly', () => {
        cy.get('.admin-table tbody tr').each(($row) => {
            cy.wrap($row).find('td').eq(6).then(($statusCell) => {
                const status = $statusCell.text().trim();
                const color = $statusCell.css('color');

                if (status === 'Sold Out') {
                    expect(color).to.match(/rgb\(255,\s*0,\s*0\)|red/);
                } else if (status === 'Running Low') {
                    expect(color).to.match(/rgb\(255,\s*165,\s*0\)|orange/);
                } else if (status === 'In Stock') {
                    expect(color).to.match(/rgb\(0,\s*128,\s*0\)|green/);
                }
            });
        });
    });

    it('should reset to page 1 when applying filters', () => {
        // Lưu trạng thái pagination hiện tại
        cy.get('.pagination span').invoke('text').then((initialPage) => {
            // Áp dụng filter
            cy.get('select').first().select('In Stock');

            // Kiểm tra vẫn ở trang 1
            cy.get('.pagination span').should('contain', '1 /');
        });
    });

    it('should display sizes information correctly', () => {
        cy.get('.admin-table tbody tr').first().within(() => {
            cy.get('td').eq(5).should(($sizesCell) => {
                const sizesText = $sizesCell.text();
                expect(sizesText).to.include('39:');
                expect(sizesText).to.include('41:');
                expect(sizesText).to.include('43:');
                expect(sizesText).to.include('44:');
            });
        });
    });
});

describe('Manage Inventory - Edge Cases', () => {
    it('should handle empty inventory', () => {
        // Mock empty response
        cy.intercept('GET', '**/api/products', {
            statusCode: 200,
            body: { products: [] }
        }).as('getEmptyProducts');

        // Visit với admin state
        cy.visit('/admin/inventory', {
            onBeforeLoad(win) {
                win.localStorage.setItem('isAdmin', 'true');
            }
        });

        cy.wait('@getEmptyProducts');

        cy.get('.inventory-summary').should('contain', 'Total Products: 0');
    });

    it('should handle API error gracefully', () => {
        cy.intercept('GET', '**/api/products', {
            statusCode: 500,
            body: { error: 'Internal Server Error' }
        }).as('getProductsError');

        cy.visit('/admin/inventory', {
            onBeforeLoad(win) {
                win.localStorage.setItem('isAdmin', 'true');
            }
        });

        cy.wait('@getProductsError');

        cy.on('window:console', (log) => {
            if (log.level === 'error') {
                expect(log.text).to.include('Lỗi load inventory:');
            }
        });
    });

    it('should handle products without images', () => {
        cy.fixture('inventory-data.json').then((data) => {
            const modifiedData = {
                products: [
                    {
                        ...data.products[0],
                        images: []
                    }
                ]
            };

            cy.intercept('GET', '**/api/products', {
                statusCode: 200,
                body: modifiedData
            }).as('getProductsNoImages');

            cy.visit('/admin/inventory', {
                onBeforeLoad(win) {
                    win.localStorage.setItem('isAdmin', 'true');
                }
            });

            cy.wait('@getProductsNoImages');

            cy.get('.admin-table tbody tr').first().within(() => {
                cy.get('td').first().should('contain', 'No Image');
            });
        });
    });

    it('should handle products without category', () => {
        cy.fixture('inventory-data.json').then((data) => {
            const modifiedData = {
                products: [
                    {
                        ...data.products[0],
                        category: null
                    }
                ]
            };

            cy.intercept('GET', '**/api/products', {
                statusCode: 200,
                body: modifiedData
            }).as('getProductsNoCategory');

            cy.visit('/admin/inventory', {
                onBeforeLoad(win) {
                    win.localStorage.setItem('isAdmin', 'true');
                }
            });

            cy.wait('@getProductsNoCategory');

            cy.get('.admin-table tbody tr').first().within(() => {
                cy.get('td').eq(3).should('contain', 'Other');
            });
        });
    });

    it('should handle network timeout', () => {
        cy.intercept('GET', '**/api/products', {
            delay: 10000, // 10 seconds delay
            body: { products: [] }
        }).as('getProductsDelayed');

        cy.visit('/admin/inventory', {
            onBeforeLoad(win) {
                win.localStorage.setItem('isAdmin', 'true');
            },
            timeout: 3000
        });

        // Component should handle timeout gracefully
        cy.get('.admin-container').should('exist');
    });
});