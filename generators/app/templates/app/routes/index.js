import * as Controller from '../controllers/<%= name %>.controller';

export default function router(app) {
  <% routes.forEach(function(route) { if (!!route.uri) { route.methods.forEach(function(method) { %>
    app.<%= method.method %>('<%= route.uri %>', Controller.<%= method.displayName %>);
  <%})}}) %>
}

