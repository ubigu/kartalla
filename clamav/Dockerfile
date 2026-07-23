##
# ClamAV image with virus definitions baked in at build time.
#
# The upstream image downloads the full virus database via freshclam on
# first start, which takes several minutes and hits ClamAV's public
# mirrors. Running freshclam once here means containers built from this
# image are ready to scan immediately; freshclamd keeps the database
# updated incrementally while the container is running.
##
FROM clamav/clamav:stable

# This ensures there's already a database on container startup (ENTRYPOINT ["/init"])
RUN freshclam --stdout
