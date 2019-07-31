import json
from notebook.utils import url_path_join
from notebook.base.handlers import APIHandler
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


def _jupyter_server_extension_paths():
    return [{
        'module': 'jupyterlab_media_capture'
    }]


def load_jupyter_server_extension(nb_server_app):
    web_app = nb_server_app.web_app
    base_url = web_app.settings['base_url']
    endpoint = url_path_join(base_url, 'media_capture')
    handlers = [(endpoint + "(.*)", MediaCaptureHandler)]
    web_app.add_handlers('.*$', handlers)
