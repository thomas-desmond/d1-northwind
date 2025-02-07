-- CreateTable
CREATE TABLE "Employee" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "lastName" TEXT,
    "firstName" TEXT,
    "title" TEXT,
    "titleOfCourtesy" TEXT,
    "birthDate" TEXT,
    "hireDate" TEXT,
    "address" TEXT,
    "city" TEXT,
    "region" TEXT,
    "postalCode" TEXT,
    "country" TEXT,
    "homePhone" TEXT,
    "extension" TEXT,
    "photo" BLOB,
    "notes" TEXT,
    "reportsTo" INTEGER,
    "photoPath" TEXT,
    CONSTRAINT "Employee_reportsTo_fkey" FOREIGN KEY ("reportsTo") REFERENCES "Employee" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Category" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "categoryName" TEXT,
    "description" TEXT
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyName" TEXT,
    "contactName" TEXT,
    "contactTitle" TEXT,
    "address" TEXT,
    "city" TEXT,
    "region" TEXT,
    "postalCode" TEXT,
    "country" TEXT,
    "phone" TEXT,
    "fax" TEXT
);

-- CreateTable
CREATE TABLE "Shipper" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "companyName" TEXT,
    "phone" TEXT
);

-- CreateTable
CREATE TABLE "Supplier" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "companyName" TEXT,
    "contactName" TEXT,
    "contactTitle" TEXT,
    "address" TEXT,
    "city" TEXT,
    "region" TEXT,
    "postalCode" TEXT,
    "country" TEXT,
    "phone" TEXT,
    "fax" TEXT,
    "homePage" TEXT
);

-- CreateTable
CREATE TABLE "Order" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "customerId" TEXT,
    "employeeId" INTEGER NOT NULL,
    "orderDate" TEXT,
    "requiredDate" TEXT,
    "shippedDate" TEXT,
    "shipVia" INTEGER,
    "freight" DECIMAL NOT NULL,
    "shipName" TEXT,
    "shipAddress" TEXT,
    "shipCity" TEXT,
    "shipRegion" TEXT,
    "shipPostalCode" TEXT,
    "shipCountry" TEXT,
    CONSTRAINT "Order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Order_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Order_shipVia_fkey" FOREIGN KEY ("shipVia") REFERENCES "Shipper" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Product" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "productName" TEXT,
    "supplierId" INTEGER NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "quantityPerUnit" TEXT,
    "unitPrice" DECIMAL NOT NULL,
    "unitsInStock" INTEGER NOT NULL,
    "unitsOnOrder" INTEGER NOT NULL,
    "reorderLevel" INTEGER NOT NULL,
    "discontinued" INTEGER NOT NULL,
    CONSTRAINT "Product_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OrderDetail" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "unitPrice" DECIMAL NOT NULL,
    "quantity" INTEGER NOT NULL,
    "discount" REAL NOT NULL,
    CONSTRAINT "OrderDetail_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "OrderDetail_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CustomerCustomerDemo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerTypeId" TEXT,
    CONSTRAINT "CustomerCustomerDemo_id_fkey" FOREIGN KEY ("id") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CustomerCustomerDemo_customerTypeId_fkey" FOREIGN KEY ("customerTypeId") REFERENCES "CustomerDemographic" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CustomerDemographic" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerDesc" TEXT
);

-- CreateTable
CREATE TABLE "Region" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "regionDescription" TEXT
);

-- CreateTable
CREATE TABLE "Territory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "territoryDescription" TEXT,
    "regionId" INTEGER NOT NULL,
    CONSTRAINT "Territory_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EmployeeTerritory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employeeId" INTEGER NOT NULL,
    "territoryId" TEXT,
    CONSTRAINT "EmployeeTerritory_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "EmployeeTerritory_territoryId_fkey" FOREIGN KEY ("territoryId") REFERENCES "Territory" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
