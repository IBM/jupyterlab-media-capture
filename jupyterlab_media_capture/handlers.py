import json

from jupyter_server.base.handlers import APIHandler
from jupyter_server.utils import url_path_join
import tornado
from os import listdir, environ, makedirs, removedirs, getcwd
from os.path import isfile, isdir, join

basedir = getcwd()

def save_file(path, content):
    content_bytes = bytearray(content)
    path ='{}/{}'.format(basedir, path)
    path = path.replace('//', '/')
    with open(path, 'wb') as new_file:
        new_file.write(content_bytes)
    return path

class MediaCaptureHandler(APIHandler):
    def get(self, path=''):
        self.finish(json.dumps({'wip': True}))

    def post(self, path=''):
        body = json.loads(self.request.body)
        saved_path = save_file(body['path'], body['content'])
        self.finish(json.dumps({'saved_path': saved_path}))

def setup_handlers(web_app):
    host_pattern = ".*$"

    base_url = web_app.settings["base_url"]
    route_pattern = url_path_join(base_url, "jupyterlab_media_capture", "media_capture")
    handlers = [(route_pattern, MediaCaptureHandler)]
    web_app.add_handlers(host_pattern, handlers)
