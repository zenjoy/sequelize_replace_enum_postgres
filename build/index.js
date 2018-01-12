'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createEnum = createEnum;
exports.getQueryToCreateEnum = getQueryToCreateEnum;
exports.unsetDefaultValueFromEnum = unsetDefaultValueFromEnum;
exports.getQueryToRemoveDefaultFromColumn = getQueryToRemoveDefaultFromColumn;
exports.setColumnTypeToEnum = setColumnTypeToEnum;
exports.getQueryToSetEnumType = getQueryToSetEnumType;
exports.dropEnum = dropEnum;
exports.getQueryToDropEnum = getQueryToDropEnum;
exports.renameEnum = renameEnum;
exports.getQueryToRenameEnum = getQueryToRenameEnum;
exports.setColumnDefault = setColumnDefault;
exports.getQueryToSetColumnDefault = getQueryToSetColumnDefault;

/**
 * Since PostgreSQL still does not support remove values from an ENUM,
 * the workaround is to create a new ENUM with the new values and use it
 * to replace the other.
 *
 * @param {Object} args
 * @param {String} args.tableName
 * @param {String} args.columnName
 * @param {String} args.defaultValue
 * @param {Array}  args.newValues
 * @param {Object} args.queryInterface
 * @param {String} args.enumName - Optional.
 *
 * @return {Promise}
 */
exports.default = function (args) {
  var tableName = args.tableName,
      columnName = args.columnName,
      defaultValue = args.defaultValue,
      newValues = args.newValues,
      queryInterface = args.queryInterface,
      _args$enumName = args.enumName,
      enumName = _args$enumName === undefined ? 'enum_' + tableName + '_' + columnName : _args$enumName;


  var newEnumName = enumName + '_new';

  return queryInterface.sequelize.transaction(function (t) {
    var sequelizeOptions = { transaction: t };

    // Create a copy of the type
    return createEnum({ queryInterface: queryInterface, name: newEnumName, values: newValues, sequelizeOptions: sequelizeOptions })
    // Drop default value (ALTER COLUMN cannot cast default values)
    .then(function () {
      return unsetDefaultValueFromEnum({ queryInterface: queryInterface, tableName: tableName, columnName: columnName, sequelizeOptions: sequelizeOptions });
    })
    // Change column type to the new ENUM TYPE
    .then(function () {
      return setColumnTypeToEnum({
        tableName: tableName,
        columnName: columnName,
        enumName: newEnumName,
        queryInterface: queryInterface,
        sequelizeOptions: sequelizeOptions
      });
    })
    // Drop old ENUM
    .then(function () {
      return dropEnum({ enumName: enumName, sequelizeOptions: sequelizeOptions, queryInterface: queryInterface });
    })
    // Rename new ENUM name
    .then(function () {
      return renameEnum({
        oldEnumName: newEnumName,
        newEnumName: enumName,
        queryInterface: queryInterface,
        sequelizeOptions: sequelizeOptions
      });
    }).then(function () {
      return setColumnDefault({
        tableName: tableName,
        columnName: columnName,
        defaultValue: defaultValue,
        defaultValueType: enumName,
        queryInterface: queryInterface,
        sequelizeOptions: sequelizeOptions
      });
    });
  });
};

/**
 * Create a new ENUM.
 *
 * @param {Object}   args
 * @param {String}   args.name
 * @param {String[]} args.values
 * @param {Object}   args.sequelizeOptions
 * @param {Object}   args.queryInterface
 *
 * @return {Promise}
 */


function createEnum(args) {
  return args.queryInterface.sequelize.query(getQueryToCreateEnum(args.name, args.values), args.sequelizeOptions);
}

/**
 * Returns the query to create an Enum.
 *
 * @param {String}   name
 * @param {String[]} values
 *
 * @return {String}
 */
function getQueryToCreateEnum(name, values) {
  return 'CREATE TYPE "' + name + '" AS ENUM (\'' + values.join('\', \'') + '\')';
}

/**
 * Unset default value from ENUM.
 *
 * @param {Object} args
 * @param {String} args.tableName
 * @param {String} args.columnName
 * @param {Object} args.sequelizeOptions
 * @param {Object} args.queryInterface
 *
 * @return {Promise}
 */
function unsetDefaultValueFromEnum(args) {
  return args.queryInterface.sequelize.query(getQueryToRemoveDefaultFromColumn(args.tableName, args.columnName), args.sequelizeOptions);
}

/**
 * Get the query to drop default value for a column.
 *
 * @param {String} tableName
 * @param {String} columnName
 *
 * @return {String}
 */
function getQueryToRemoveDefaultFromColumn(tableName, columnName) {
  return 'ALTER TABLE "' + tableName + '" ALTER COLUMN "' + columnName + '" DROP DEFAULT';
}

/**
 * Set the column type to an Enum.
 *
 * @param {Object} args
 * @param {String} args.tableName
 * @param {String} args.columnName
 * @param {String} args.enumName
 * @param {Object} args.sequelizeOptions
 *
 * @return {Promise}
 */
function setColumnTypeToEnum(args) {
  return args.queryInterface.sequelize.query(getQueryToSetEnumType(args.tableName, args.columnName, args.enumName), args.sequelizeOptions);
}

/**
 * Get the query to set a column type to an Enum.
 *
 * @param {String} tableName
 * @param {String} columnName
 * @param {String} enumName
 *
 * @return {String}
 */
function getQueryToSetEnumType(tableName, columnName, enumName) {
  return '\n    ALTER TABLE "' + tableName + '"\n      ALTER COLUMN "' + columnName + '"\n        TYPE "' + enumName + '"\n        USING ("' + columnName + '"::text::"' + enumName + '")\n  ';
}

/**
 * Drop an Enum.
 *
 * @param {Object} args
 * @param {Object} args.queryInterface
 * @param {String} args.enumName
 * @param {Object} args.sequelizeOptions
 *
 * @return {Promise}
 */
function dropEnum(args) {
  return args.queryInterface.sequelize.query(getQueryToDropEnum(args.enumName), args.sequelizeOptions);
}

/**
 * Get the query to drop an Enum.
 *
 * @param {String} enumName
 *
 * @return {String}
 */
function getQueryToDropEnum(enumName) {
  return 'DROP TYPE "' + enumName + '"';
}

/**
 * Rename an Enum.
 *
 * @param {Object} args
 * @param {Object} args.queryInterface
 * @param {String} args.oldEnumName
 * @param {String} args.newEnumName
 * @param {Object} args.sequelizeOptions
 *
 * @return {Promise}
 */
function renameEnum(args) {
  return args.queryInterface.sequelize.query(getQueryToRenameEnum(args.oldEnumName, args.newEnumName), args.sequelizeOptions);
}

/**
 * Get the query to rename an enum.
 *
 * @param {String} oldEnumName
 * @param {String} newEnumName
 *
 * @return {String}
 */
function getQueryToRenameEnum(oldEnumName, newEnumName) {
  return 'ALTER TYPE "' + oldEnumName + '" RENAME TO "' + newEnumName + '"';
}

/**
 * Set the default value for a column.
 *
 * @param {Object} args
 * @param {Object} args.queryInterface
 * @param {String} args.tableName
 * @param {String} args.columnName
 * @param {String} args.defaultValue
 * @param {String} args.defaultValueType
 * @param {Object} args.sequelizeOptions
 *
 * @return {Promise}
 */
function setColumnDefault(args) {
  return args.queryInterface.sequelize.query(getQueryToSetColumnDefault(args.tableName, args.columnName, args.defaultValue, args.defaultValueType), args.sequelizeOptions);
}

/**
 * Get the query to set the default value for a column.
 *
 * @param {String} tableName
 * @param {String} columnName
 * @param {String} defaultValue
 * @param {String} defaultValueType
 *
 * @return {String}
 */
function getQueryToSetColumnDefault(tableName, columnName, defaultValue, defaultValueType) {
  return '\n    ALTER TABLE "' + tableName + '"\n      ALTER COLUMN "' + columnName + '"\n        SET DEFAULT \'' + defaultValue + '\'::"' + defaultValueType + '"\n  ';
}
//# sourceMappingURL=index.js.map