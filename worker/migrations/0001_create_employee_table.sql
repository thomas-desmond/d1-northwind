-- CreateTable
CREATE TABLE "Employee" (
    "Id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "LastName" TEXT,
    "FirstName" TEXT,
    "Title" TEXT,
    "TitleOfCourtesy" TEXT,
    "BirthDate" TEXT,
    "HireDate" TEXT,
    "Address" TEXT,
    "City" TEXT,
    "Region" TEXT,
    "PostalCode" TEXT,
    "Country" TEXT,
    "HomePhone" TEXT,
    "Extension" TEXT,
    "Photo" BLOB,
    "Notes" TEXT,
    "ReportsTo" INTEGER,
    "PhotoPath" TEXT
);
