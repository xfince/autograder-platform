/**
 * tests/backend/database.test.js
 * 
 * Tests for database connectivity and CRUD operations
 * Evaluates: Criterion 4 (Database Design & Integration)
 */

const mongoose = require('mongoose');
const path = require('path');

const TEST_TIMEOUT = 30000;

describe('Database Integration Tests', () => {
  let testResults = {
    criterion_id: 'criterion_4',
    total_tests: 0,
    passed: 0,
    failed: 0,
    details: []
  };

  beforeAll(async () => {
    try {
      // Connect to test database
      if (mongoose.connection.readyState === 0) {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/test_db');
        console.log('✅ Connected to test database');
      }
    } catch (error) {
      console.error('Database connection error:', error.message);
    }
  }, TEST_TIMEOUT);

  afterAll(async () => {
    try {
      if (mongoose.connection.readyState === 1) {
        await mongoose.connection.db.dropDatabase();
        await mongoose.connection.close();
      }
      console.log(JSON.stringify(testResults, null, 2));
    } catch (error) {
      console.error('Cleanup error:', error.message);
    }
  }, TEST_TIMEOUT);

  const recordTest = (testName, passed, error = null) => {
    testResults.total_tests++;
    if (passed) {
      testResults.passed++;
    } else {
      testResults.failed++;
    }
    testResults.details.push({
      test: testName,
      passed,
      error: error ? error.message : null
    });
  };

  describe('Database Connection', () => {
    test('MongoDB connection is established', () => {
      try {
        expect(mongoose.connection.readyState).toBe(1); // 1 = connected
        recordTest('MongoDB connection established', true);
      } catch (error) {
        recordTest('MongoDB connection established', false, error);
        throw error;
      }
    });

    test('Database name is configured', () => {
      try {
        const dbName = mongoose.connection.db.databaseName;
        expect(dbName).toBeDefined();
        expect(dbName.length).toBeGreaterThan(0);
        recordTest('Database name configured', true);
      } catch (error) {
        recordTest('Database name configured', false, error);
        throw error;
      }
    });
  });

  describe('Mongoose Models', () => {
    let models = [];
    let UserModel = null;

    beforeAll(async () => {
      try {
        // Try to find and load student models (check grading-folder first, then root)
        const fs = require('fs');
        const modelPaths = [
          path.join(process.cwd(), 'grading-folder', 'backend', 'models'),
          path.join(process.cwd(), 'grading-folder', 'server', 'models'),
          path.join(process.cwd(), 'server', 'models'),
          path.join(process.cwd(), 'backend', 'models'),
          path.join(process.cwd(), 'models')
        ];

        for (const modelPath of modelPaths) {
          if (fs.existsSync(modelPath)) {
            const files = fs.readdirSync(modelPath);
            
            for (const file of files) {
              if (file.endsWith('.js') || file.endsWith('.ts')) {
                try {
                  const model = require(path.join(modelPath, file));
                  if (model && model.modelName) {
                    models.push(model);
                    
                    // Try to identify User model
                    if (model.modelName.toLowerCase().includes('user')) {
                      UserModel = model;
                    }
                  }
                } catch (err) {
                  console.log(`Could not load model from ${file}`);
                }
              }
            }
            break;
          }
        }
      } catch (error) {
        console.log('Could not load models:', error.message);
      }
    });

    test('At least one Mongoose model is defined', () => {
      try {
        const mongooseModels = Object.keys(mongoose.models);
        expect(mongooseModels.length).toBeGreaterThan(0);
        recordTest('Mongoose models defined', true);
      } catch (error) {
        recordTest('Mongoose models defined', false, error);
        throw error;
      }
    });

    test('Models have proper schema definition', () => {
      try {
        const mongooseModels = Object.values(mongoose.models);
        
        if (mongooseModels.length === 0) {
          recordTest('Models have schema', false, new Error('No models found'));
          return;
        }

        // Check first model has schema
        const firstModel = mongooseModels[0];
        expect(firstModel.schema).toBeDefined();
        expect(firstModel.schema.paths).toBeDefined();
        
        recordTest('Models have schema', true);
      } catch (error) {
        recordTest('Models have schema', false, error);
        throw error;
      }
    });

    test('Schema includes required fields', () => {
      try {
        const mongooseModels = Object.values(mongoose.models);
        
        if (mongooseModels.length === 0) {
          recordTest('Schema has required fields', false, new Error('No models found'));
          return;
        }

        // Check if any model has required fields
        let hasRequiredFields = false;
        
        for (const model of mongooseModels) {
          const paths = Object.values(model.schema.paths);
          const requiredPaths = paths.filter(path => path.isRequired);
          
          if (requiredPaths.length > 0) {
            hasRequiredFields = true;
            break;
          }
        }

        expect(hasRequiredFields).toBe(true);
        recordTest('Schema has required fields', true);
      } catch (error) {
        recordTest('Schema has required fields', false, error);
        throw error;
      }
    });

    test('Schema includes data validation', () => {
      try {
        const mongooseModels = Object.values(mongoose.models);
        
        if (mongooseModels.length === 0) {
          recordTest('Schema has validation', false, new Error('No models found'));
          return;
        }

        // Check if any model has validators
        let hasValidation = false;
        
        for (const model of mongooseModels) {
          const paths = Object.values(model.schema.paths);
          
          for (const path of paths) {
            // Check for validators (min, max, enum, match, etc.)
            if (path.validators && path.validators.length > 0) {
              hasValidation = true;
              break;
            }
            // Check for enum values
            if (path.enumValues && path.enumValues.length > 0) {
              hasValidation = true;
              break;
            }
            // Check for min/max
            if (path.options && (path.options.min || path.options.max || path.options.match)) {
              hasValidation = true;
              break;
            }
          }
          
          if (hasValidation) break;
        }

        expect(hasValidation).toBe(true);
        recordTest('Schema has validation', true);
      } catch (error) {
        recordTest('Schema has validation', false, error);
        throw error;
      }
    });
  });

  describe('CRUD Operations', () => {
    let testDocumentId;
    let TestModel;

    beforeAll(() => {
      // Get first available model for testing
      const mongooseModels = Object.values(mongoose.models);
      if (mongooseModels.length > 0) {
        TestModel = mongooseModels[0];
      }
    });

    test('CREATE: Can insert documents into database', async () => {
      if (!TestModel) {
        recordTest('CREATE operation', false, new Error('No model available'));
        return;
      }

      try {
        // Create test document with minimal data
        const schemaFields = Object.keys(TestModel.schema.paths);
        const testData = {};
        
        // Fill required fields with dummy data
        for (const field of schemaFields) {
          const path = TestModel.schema.paths[field];
          
          if (path.isRequired && field !== '_id' && field !== '__v') {
            // Generate dummy data based on type
            if (path.instance === 'String') {
              testData[field] = 'test_value_' + field;
            } else if (path.instance === 'Number') {
              testData[field] = 123;
            } else if (path.instance === 'Boolean') {
              testData[field] = true;
            } else if (path.instance === 'Date') {
              testData[field] = new Date();
            }
          }
        }

        const doc = await TestModel.create(testData);
        testDocumentId = doc._id;

        expect(doc).toBeDefined();
        expect(doc._id).toBeDefined();
        recordTest('CREATE operation', true);
      } catch (error) {
        recordTest('CREATE operation', false, error);
        throw error;
      }
    });

    test('READ: Can query documents from database', async () => {
      if (!TestModel) {
        recordTest('READ operation', false, new Error('No model available'));
        return;
      }

      try {
        const docs = await TestModel.find({}).limit(10);
        expect(Array.isArray(docs)).toBe(true);
        recordTest('READ operation', true);
      } catch (error) {
        recordTest('READ operation', false, error);
        throw error;
      }
    });

    test('READ: Can find document by ID', async () => {
      if (!TestModel || !testDocumentId) {
        recordTest('READ by ID', false, new Error('No test document'));
        return;
      }

      try {
        const doc = await TestModel.findById(testDocumentId);
        expect(doc).toBeDefined();
        expect(doc._id.toString()).toBe(testDocumentId.toString());
        recordTest('READ by ID', true);
      } catch (error) {
        recordTest('READ by ID', false, error);
        throw error;
      }
    });

    test('UPDATE: Can update documents', async () => {
      if (!TestModel || !testDocumentId) {
        recordTest('UPDATE operation', false, new Error('No test document'));
        return;
      }

      try {
        // Find a field we can update
        const schemaFields = Object.keys(TestModel.schema.paths);
        let updateField = null;
        
        for (const field of schemaFields) {
          const path = TestModel.schema.paths[field];
          if (field !== '_id' && field !== '__v' && path.instance === 'String') {
            updateField = field;
            break;
          }
        }

        if (!updateField) {
          // If no string field, just pass the test
          recordTest('UPDATE operation', true);
          return;
        }

        const updateData = { [updateField]: 'updated_value' };
        const updated = await TestModel.findByIdAndUpdate(
          testDocumentId,
          updateData,
          { new: true }
        );

        expect(updated).toBeDefined();
        expect(updated[updateField]).toBe('updated_value');
        recordTest('UPDATE operation', true);
      } catch (error) {
        recordTest('UPDATE operation', false, error);
        throw error;
      }
    });

    test('DELETE: Can delete documents', async () => {
      if (!TestModel || !testDocumentId) {
        recordTest('DELETE operation', false, new Error('No test document'));
        return;
      }

      try {
        const deleted = await TestModel.findByIdAndDelete(testDocumentId);
        expect(deleted).toBeDefined();
        
        // Verify it's gone
        const notFound = await TestModel.findById(testDocumentId);
        expect(notFound).toBeNull();
        
        recordTest('DELETE operation', true);
      } catch (error) {
        recordTest('DELETE operation', false, error);
        throw error;
      }
    });
  });

  describe('Data Relationships', () => {
    test('Models use proper references/relationships', async () => {
      try {
        const mongooseModels = Object.values(mongoose.models);
        
        if (mongooseModels.length === 0) {
          recordTest('Model relationships', false, new Error('No models found'));
          return;
        }

        // Check if any model has references to other models
        let hasReferences = false;
        
        for (const model of mongooseModels) {
          const paths = Object.values(model.schema.paths);
          
          for (const path of paths) {
            // Check for ObjectId references
            if (path.options && path.options.ref) {
              hasReferences = true;
              break;
            }
            // Check for array of references
            if (path.instance === 'Array' && path.caster && path.caster.options && path.caster.options.ref) {
              hasReferences = true;
              break;
            }
          }
          
          if (hasReferences) break;
        }

        // Relationships are good but not required for simple apps
        recordTest('Model relationships', hasReferences);
        expect(true).toBe(true);
      } catch (error) {
        recordTest('Model relationships', false, error);
      }
    });
  });

  describe('Database Efficiency', () => {
    test('Models use indexes for frequently queried fields', () => {
      try {
        const mongooseModels = Object.values(mongoose.models);
        
        if (mongooseModels.length === 0) {
          recordTest('Database indexes', false, new Error('No models found'));
          return;
        }

        // Check if any model has indexes
        let hasIndexes = false;
        
        for (const model of mongooseModels) {
          const indexes = model.schema.indexes();
          if (indexes && indexes.length > 0) {
            hasIndexes = true;
            break;
          }
        }

        // Indexes are optimization, not critical
        recordTest('Database indexes', hasIndexes);
        expect(true).toBe(true);
      } catch (error) {
        recordTest('Database indexes', false, error);
      }
    });
  });

  describe('Data Integrity', () => {
    test('Models enforce unique constraints where appropriate', () => {
      try {
        const mongooseModels = Object.values(mongoose.models);
        
        if (mongooseModels.length === 0) {
          recordTest('Unique constraints', false, new Error('No models found'));
          return;
        }

        // Check if any model has unique fields (like email)
        let hasUniqueFields = false;
        
        for (const model of mongooseModels) {
          const paths = Object.values(model.schema.paths);
          
          for (const path of paths) {
            if (path.options && path.options.unique === true) {
              hasUniqueFields = true;
              break;
            }
          }
          
          if (hasUniqueFields) break;
        }

        expect(hasUniqueFields).toBe(true);
        recordTest('Unique constraints', true);
      } catch (error) {
        recordTest('Unique constraints', false, error);
        throw error;
      }
    });

    test('Models handle default values', () => {
      try {
        const mongooseModels = Object.values(mongoose.models);
        
        if (mongooseModels.length === 0) {
          recordTest('Default values', false, new Error('No models found'));
          return;
        }

        // Check if any model has default values
        let hasDefaults = false;
        
        for (const model of mongooseModels) {
          const paths = Object.values(model.schema.paths);
          
          for (const path of paths) {
            if (path.options && path.options.default !== undefined) {
              hasDefaults = true;
              break;
            }
          }
          
          if (hasDefaults) break;
        }

        // Defaults are good practice but not critical
        recordTest('Default values', hasDefaults);
        expect(true).toBe(true);
      } catch (error) {
        recordTest('Default values', false, error);
      }
    });
  });

  describe('Timestamps', () => {
    test('Models use timestamps (createdAt, updatedAt)', () => {
      try {
        const mongooseModels = Object.values(mongoose.models);
        
        if (mongooseModels.length === 0) {
          recordTest('Timestamps enabled', false, new Error('No models found'));
          return;
        }

        // Check if any model has timestamps enabled
        let hasTimestamps = false;
        
        for (const model of mongooseModels) {
          if (model.schema.options.timestamps === true) {
            hasTimestamps = true;
            break;
          }
          
          // Also check for manual createdAt/updatedAt fields
          if (model.schema.paths.createdAt || model.schema.paths.updatedAt) {
            hasTimestamps = true;
            break;
          }
        }

        // Timestamps are good practice
        recordTest('Timestamps enabled', hasTimestamps);
        expect(true).toBe(true);
      } catch (error) {
        recordTest('Timestamps enabled', false, error);
      }
    });
  });
});

module.exports = { testResults };