create database eppgava;

create table user(
  user_id int primary key,
  name varchar(50) not null,
  last_name varchar(50) not null,
  email varchar(50) not null,
  password varchar(50) not null
);

create table user_type(
  user_type_id primary key,
  name varchar(50)
);

create table epp(
  epp_id int primary key,
  name varchar(50) not null,
  description varchar(255) not null default 'Sin descripción',
);

create table request(
  request_id int primary key,
  registration_date date not null,
  acceptance_date date null,
  status (pending, accepted, rejected) not null default 'pending',
  description varchar(255) not null,
  user_id int not null foreign key references user(user_id),
);

create table request_rejected(
  request_rejected int primary key,
  rejection_date date not null,
  description varchar(50) null,
  request_id int not null foreign key references request(request_id)
);

create table epp_request(
  epp_request_id int primary key,
  quantity int not null,
  user_id int foreign key references user(user_id),
  epp_id int foreign key references epp(epp_id),
  request_id int foreign key references request(request_id),
)