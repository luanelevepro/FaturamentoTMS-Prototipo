A Supabase client smartly handles cookies to manage user sessions, adapting its strategy based on the execution context:

• Server-Side (getServerSideProps):  
	Runs on the server. The client reads cookies from the incoming request via GetServerSidePropsContext.

• Static Generation (getStaticProps):  
	Executes at build time. There is no user session or cookies available in this scenario.

• Client-Side (Component):  
	Operates in the browser. Cookies are accessed through browser storage. Under the hood, createBrowserClient reuses the same instance if invoked multiple times, eliminating redundant client creation.

• API Routes:  
	Runs on the server. Cookies are extracted from the request using NextApiRequest.

Each context ensures that cookie handling is optimized for its specific environment, providing seamless session management.
