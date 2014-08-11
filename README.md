Alvex Datagrid
==============

Generic purpose datagrid enhancements extracted from Alvex sources and refactored for Alfresco Maven SDK.

##Building
1. Install Maven
2. Build Repo part. Go to *alvex-datagrid-repo* and run **mvn package -DskipTests=true**. We skip tests to make build a bit faster, since we have no tests yet anyway.
3. Repeat the same for Share part. Go to *alvex-datagrid-share* and run **mvn package -DskipTests=true**.

##Installing
1. Copy *alvex-datagrid-repo/target/alvex-datagrid-repo.amp* into your *${ALFRESCO_HOME}/amps/* and *alvex-datagrid-share/target/alvex-datagrid-share.amp* into your *${ALFRESCO_HOME}/amps_share/*.
2. Go to *${ALFRESCO_HOME}/bin* and run **./apply_amps.sh** (for Linux) or **apply_amps.bat** (for Windows).

##Features
1. End user features are described in [this blog post](http://blog.itdhq.com/post/86483480150/2014-05-22-alvex-datagrid-end-user-features).
2. We have also [a short video](http://www.youtube.com/watch?v=5OiTKq-VJ98) regarding end user features.
3. Creating custom cell renderers - [blog post](http://blog.itdhq.com/post/91354985705/2014-07-10-alvex-datagrid-custom-renderers).
4. Adding custom item actions - [blog post](http://blog.itdhq.com/post/91431300460/2014-07-11-alvex-datagrid-custom-actions).
