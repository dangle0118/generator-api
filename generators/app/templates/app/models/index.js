/**
 * Module dependencies.
 */
import mongoose from 'mongoose';
var Schema = mongoose.Schema;

var <%= model.schemaName %>Schema = new Schema({
	<% for (var key in model.properties) { %>
	<%= key %>: { <% for (var keyAttr in model.properties[key]) { %>
		<%- keyAttr %>: <%- model.properties[key][keyAttr] %>,	<% } %>
	},
	<% } %>
});

var <%= model.schemaName %> = mongoose.model('<%= model.schemaName %>', <%= model.schemaName %>Schema);

export default <%= model.schemaName %>;
