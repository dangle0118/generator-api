
<% controllers.forEach(function(controller) { %>
export function <%= controller.name %>(req, res) {
	<% if (controller.responses['200']) { %>
	//Return a success result 
	return res.json(<%- JSON.stringify(controller.responses['200'], null, 4) %>);
	<% } %>
	<% if (controller.responses['400']) { %>
	//Return a success result 
	return res.status(400).json(<%- JSON.stringify(controller.responses['400'], null, 4) %>);
	<% } %>
}
<% }) %>
