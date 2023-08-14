# FMH Database Analyzer

Creates a GraqphQL frontend by using the the database schema/fiels as single sourc of truth

What's the Rationale?

During the lifetime of an application or domain service the structure of a
database might change and it might change often.

If the mysql schema is defined statically chances are that a changes in the
database will not find their way into the graphql schema.

Enter FMH Database Analyzer ...

This tool walks through the database, picks up the tables, checks for relations,
creates the respective data types and wires them by building resolvers.

And not only that: it offers you sorting, querying and pagination on each node.

So it does most of the heavy lifting and you can go straight to work.

And again, whether you are running migrations on your database or use
SQL-scripts: your graphql schema will always match your database.

## For mysql/mariadb databases

These are the field name conventions being followed

1. [fieldname]\_id denotes relation to a table named by pluralized fieldname
2. parent_id denotes a simple parent child relation allowing for simple tree structures
3.

## For mongodb

dropped mongodb support
